document.addEventListener('DOMContentLoaded', () => {
    let recordButton = document.getElementById('recordButton');
    let stopButton = document.getElementById('stopButton');
    let speakButton = document.getElementById('speakButton');
    let audioPlayback = document.getElementById('audioPlayback');
    let mediaRecorder;
    let audioChunks = [];

    // 每 1 秒更新一次
    function fetchUpdates() {
        fetch('/get_updates')
            .then(response => response.json())
            .then(data => {
                document.getElementById('transcription_text').textContent = data.transcription_text;
                document.getElementById('response_text').textContent = data.response_text;
            })
            .catch(error => console.error('Error fetching updates:', error));
    }

    setInterval(fetchUpdates, 1000);

    recordButton.addEventListener('click', async () => {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            let audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;

            // 将录音文件上传到服务器
            let formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            let response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // 上传成功后触发 DaMao.py 处理
                let processResponse = await fetch('/process_audio', {
                    method: 'POST'
                });

                if (processResponse.ok) {
                    console.log('音频处理成功');
                } else {
                    alert('音频处理失败');
                }
                
                // 刷新页面以显示处理结果
                window.location.reload();
            } else {
                alert('上传失败');
            }
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
    });

    stopButton.addEventListener('click', () => {
        mediaRecorder.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
    });

    // 初始化 Live2D 虚拟人物
    const cubism2Model = "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json";
    let model2;

    (async function main() {
        const app = new PIXI.Application({
            view: document.getElementById("canvas"),
            autoStart: true,
            resizeTo: window
        });

        model2 = await PIXI.live2d.Live2DModel.from(cubism2Model);
        app.stage.addChild(model2);

        // 设置模型位置和缩放
        model2.position.set(app.renderer.width / 3, app.renderer.height / 2); // 左 1/3 处
        model2.anchor.set(0.5, 0.5); // 设置锚点为中心
        model2.scale.set(0.3);

        // 启用播放音频按钮
        speakButton.disabled = false;
    })();

    speakButton.addEventListener('click', async () => {
        const audio_link = "/audio/response.mp3"; // 使用 Flask 路由提供的音频链接

        // 确保 model2 已初始化
        if (model2) {
            // 播放音频
            const audio = new Audio(audio_link);
            audio.volume = 1;

            // 使用 motion 方法播放音频和口型同步
            model2.motion("default", 0, 2, {
                sound: audio_link,
                volume: 1,
                expression: 4, // 可以根据需要设置不同的表情
                onFinish: () => { console.log("Voiceline and Animation is over") },
                onError: (err) => { console.log("Error: " + err) },
                crossOrigin: "anonymous"
            });

            // 播放音频
            audio.play();
        } else {
            alert('Model not initialized');
        }
    });
});
