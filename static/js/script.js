document.addEventListener('DOMContentLoaded', () => {
    let recordButton = document.getElementById('recordButton');
    let stopButton = document.getElementById('stopButton');
    let playRecordingButton = document.getElementById('playRecordingButton');
    let modelDaMaoButton = document.getElementById('modelDaMao');
    let modelErmaoButton = document.getElementById('modelErmao');
    let mediaRecorder;
    let audioChunks = [];
    let currentAudio = null;
    let isAudioPlaying = false;
    let isRecording = false;
    let modelDaMao = null;
    let modelErmao = null;
    let currentModel = null; // 当前显示的模型
    
    // 模型路径
    const cubismModel =  {
        DaMao: 'static/model/shizuku/shizuku.model.json',
        Ermao: 'static/model/wanko/assets/wanko.model.json'
    };

    async function fetchUpdates() {
        try {
            let response = await fetch('/get_updates');
            let data = await response.json();
            document.getElementById('transcription_text').textContent = data.transcription_text;
            document.getElementById('response_text').textContent = data.response_text;
            latestAudioUrl = data.audio_url;  // 获取最新的音频URL
        } catch (error) {
            console.error('Error fetching updates:', error);
        }
    }

    async function startRecording() {
        stopAllAudio();
        if (isRecording) return;

        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

        mediaRecorder.onstop = async () => {
            let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];

            let formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            let response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                let processResponse = await fetch('/process_audio', { method: 'POST' });
                if (processResponse.ok) {
                    console.log('音频处理成功');
                    await fetchUpdates(); // 确保在处理音频后获取最新更新
                } else {
                    alert('音频处理失败');
                }
            } else {
                alert('上传失败');
            }
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
        isRecording = true;
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            recordButton.disabled = false;
            stopButton.disabled = true;
            isRecording = false;
        }
    }

    function stopAllAudio() {
        if (isAudioPlaying && currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            isAudioPlaying = false;

            if (currentModel) currentModel.stopSpeaking();
        }
    }


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

        model2.position.set(app.renderer.width / 3, app.renderer.height / 2);
        model2.anchor.set(0.5, 0.5);
        model2.scale.set(0.8);

        playRecordingButton.disabled = false;
    })();

    async function loadModel(modelName, position, scale) {
        try {
            // 销毁当前模型，若存在
            if (currentModel) {
                try {
                    app.stage.removeChild(currentModel);
                    currentModel.destroy({ children: true, texture: true, baseTexture: true });
                } catch (e) {
                    console.error('Error while destroying previous model:', e);
                }
                currentModel = null;
            }
    
            // 加载新模型
            const modelPath = cubismModel[modelName];
            currentModel = await PIXI.live2d.Live2DModel.from(modelPath);
            currentModel.position.set(position.x, position.y);
            currentModel.anchor.set(0.5, 0.5); // 中心对齐
            currentModel.scale.set(scale.x, scale.y);
            app.stage.addChild(currentModel);
    
            console.log(`模型 ${modelPath} 加载成功`);
        } catch (error) {
            console.error(`加载模型 ${modelPath} 失败:`, error);
            document.getElementById('loading').innerText = '加载模型失败';
        }
    }


    function playAudio() {
        if (isRecording) return;

        stopAllAudio();

        const timestamp = new Date().getTime();
        const audio_link = `/audio/response.mp3?t=${timestamp}`;
        
        currentAudio = new Audio(audio_link);
        currentAudio.crossOrigin = "anonymous";
        currentAudio.play().then(() => {
            isAudioPlaying = true;
            if (currentModel) {
                currentModel.speak(audio_link, {
                    volume: 1,
                    expression: 3,
                    resetExpression: true,
                    crossOrigin: "anonymous"
                }).catch(error => console.error('Failed to play audio:', error));
            }
        }).catch(error => console.error('Failed to play audio:', error));

        currentAudio.onended = () => {
            isAudioPlaying = false;
        };
    }

    function playRecording() {
        playAudio();
    }

    function setup() {
        recordButton.addEventListener('click', (event) => {
            event.stopPropagation();
            startRecording();
        });
        stopButton.addEventListener('click', (event) => {
            event.stopPropagation();
            stopRecording();
        });
        playRecordingButton.addEventListener('click', (event) => {
            event.stopPropagation();
            playRecording();
        });

        modelDaMaoButton.addEventListener('click', (event) => {
            event.stopPropagation();
            loadModel('DaMao', { x: app.renderer.width / 3, y: app.renderer.height / 2 }, { x: 0.7, y: 0.7 });
        });
        modelErmaoButton.addEventListener('click', (event) => {
            event.stopPropagation();
            loadModel('Ermao', { x: app.renderer.width / 3 -100, y: app.renderer.height / 2 + 900 }, { x: 0.8, y: 1 });
        });
    }

    (async function main() {
        window.app = new PIXI.Application({
            view: document.getElementById("canvas"),
            autoStart: true,
            resizeTo: window
        });

        // 默认加载第一个模型
        await loadModel('DaMao', { x: app.renderer.width / 3, y: app.renderer.height / 2 }, { x: 0.7, y: 0.7 });

        playRecordingButton.disabled = false;
    })();

    setInterval(fetchUpdates, 3000);

    setup();
});
