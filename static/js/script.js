document.addEventListener('DOMContentLoaded', () => {
    let recordButton = document.getElementById('recordButton');
    let stopButton = document.getElementById('stopButton');
    let playRecordingButton = document.getElementById('playRecordingButton');
    let mediaRecorder;
    let audioChunks = [];
    let currentAudio = null;
    let isAudioPlaying = false;   // 初始聲音播放狀態為否
    let isRecording = false;      // 初始錄音狀態為否

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

    async function startRecording() {
        // 确保录音时停止所有正在播放的音频
        stopAllAudio();

        if (isRecording) {
            return; // 如果正在录音，则不启动新的录音
        }
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = async () => {
            let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = []; // 清空audioChunks

            // 將錄音文件上傳到伺服器
            let formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            let response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                // 上傳成功後觸發 DaMao.py 處理
                let processResponse = await fetch('/process_audio', {
                    method: 'POST'
                });

                if (processResponse.ok) {
                    console.log('音頻處理成功');
                } else {
                    alert('音頻處理失敗');
                }
                
                // 刷新頁面以顯示處理結果
                window.location.reload();
            } else {
                alert('上傳失敗');
            }
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
        isRecording = true; // 录音开始时设置标志
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            recordButton.disabled = false;
            stopButton.disabled = true;
            isRecording = false; // 录音结束后重置标志
        }
    }

    function stopAllAudio() {
        if (isAudioPlaying && currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            isAudioPlaying = false;

            // 停止模型的嘴部动作
            if (model2) {
                model2.stopSpeaking();
            }
        }
    }

    // 初始化 Live2D 虛擬人物
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

        // 設置模型位置和縮放
        model2.position.set(app.renderer.width / 3, app.renderer.height / 2); // 左 1/3 處
        model2.anchor.set(0.5, 0.5); // 設置錨點為中心
        model2.scale.set(0.3);

        // 啟用播放音頻按鈕
        playRecordingButton.disabled = false;
    })();

    function playAudio() {
        if (isRecording) {
            return; // 如果正在录音，则不播放音频
        }

        stopAllAudio(); // 确保在播放新音频之前停止所有音频

        const audio_link = "/audio/response.mp3"; // 使用 Flask 路由提供的音頻鏈接
        currentAudio = new Audio(audio_link);
        currentAudio.crossOrigin = "anonymous";
        currentAudio.play().then(() => {
            isAudioPlaying = true;
            // 使模型口部动作与音频同步
            model2.speak(audio_link, {
                volume: 1,
                expression: 3,
                resetExpression: true,
                crossOrigin: "anonymous"
            }).catch(error => {
                console.error('Failed to play audio:', error);
            });
        }).catch(error => {
            console.error('Failed to play audio:', error);
        });

        currentAudio.onended = () => {
            isAudioPlaying = false; // 播放完成后重置标志
        };
    }

    function playRecording() {
        playAudio(); // 代替原来的播放录音功能，改为播放指定音频
    }

    function setup() {
        recordButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 阻止点击事件冒泡
            startRecording();
        });
        stopButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 阻止点击事件冒泡
            stopRecording();
        });
        playRecordingButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 阻止点击事件冒泡
            playRecording(); // 播放音频
        });
    }
    setup();
});
