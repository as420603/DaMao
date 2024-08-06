document.addEventListener('DOMContentLoaded', () => {
    // 取得 DOM 元素
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
    let currentModel = null; // 當前顯示的模型
    
    // 模型路徑
    const cubismModel =  {
        DaMao: 'static/model/shizuku/shizuku.model.json',
        Ermao: 'static/model/wanko/assets/wanko.model.json'
    };

    // 獲取更新
    async function fetchUpdates() {
        try {
            let response = await fetch('/get_updates');
            let data = await response.json();
            document.getElementById('transcription_text').textContent = data.transcription_text;
            document.getElementById('response_text').textContent = data.response_text;
            latestAudioUrl = data.audio_url;  // 獲取最新的音頻 URL
        } catch (error) {
            console.error('獲取更新錯誤:', error);
        }
    }

    // 開始錄音
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
                    console.log('音頻處理成功');
                    await fetchUpdates(); // 確保在處理音頻後獲取最新更新
                } else {
                    alert('音頻處理失敗');
                }
            } else {
                alert('上傳失敗');
            }
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
        isRecording = true;
    }

    // 停止錄音
    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            recordButton.disabled = false;
            stopButton.disabled = true;
            isRecording = false;
        }
    }

    // 停止所有音頻
    function stopAllAudio() {
        if (isAudioPlaying && currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            isAudioPlaying = false;

            if (currentModel) currentModel.stopSpeaking();
        }
    }

    // 加載模型
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

    // 加載指定模型
    async function loadModel(modelName, position, scale) {
        try {
            // 銷毀當前模型（如果存在）
            if (currentModel) {
                try {
                    app.stage.removeChild(currentModel);
                    currentModel.destroy({ children: true, texture: true, baseTexture: true });
                } catch (e) {
                    console.error('銷毀先前模型時出錯:', e);
                }
                currentModel = null;
            }
    
            // 加載新模型
            const modelPath = cubismModel[modelName];
            currentModel = await PIXI.live2d.Live2DModel.from(modelPath);
            currentModel.position.set(position.x, position.y);
            currentModel.anchor.set(0.5, 0.5); // 中心對齊
            currentModel.scale.set(scale.x, scale.y);
            app.stage.addChild(currentModel);
    
            console.log(`模型 ${modelPath} 加載成功`);
        } catch (error) {
            console.error(`加載模型 ${modelPath} 失敗:`, error);
            document.getElementById('loading').innerText = '加載模型失敗';
        }
    }

    // 播放音頻
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
                }).catch(error => console.error('播放音頻失敗:', error));
            }
        }).catch(error => console.error('播放音頻失敗:', error));

        currentAudio.onended = () => {
            isAudioPlaying = false;
        };
    }

    // 播放錄音
    function playRecording() {
        playAudio();
    }

    // 設置事件監聽器
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

    // 主函數
    (async function main() {
        window.app = new PIXI.Application({
            view: document.getElementById("canvas"),
            autoStart: true,
            resizeTo: window
        });

        // 默認加載第一個模型
        await loadModel('DaMao', { x: app.renderer.width / 3, y: app.renderer.height / 2 }, { x: 0.7, y: 0.7 });

        playRecordingButton.disabled = false;
    })();

    // 定時獲取更新
    setInterval(fetchUpdates, 3000);

    // 設置事件
    setup();
});
