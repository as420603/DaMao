let recordButton = document.getElementById('recordButton');
let stopButton = document.getElementById('stopButton');
let speakButton = document.getElementById('speakButton');
let audioPlayback = document.getElementById('audioPlayback');
let mediaRecorder;
let audioChunks = [];

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

        // 將錄音文件上傳到伺服器
        let formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        let response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            window.location.reload();  // 成功上傳後刷新頁面
        } else {
            alert('上傳失敗');
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

    // 設定模型位置和縮放
    model2.position.set(app.renderer.width / 3, app.renderer.height / 2); // 左 1/3 處
    model2.anchor.set(0.5, 0.5); // 設定錨點為中心
    model2.scale.set(0.3);

    // 啟用播放音頻按鈕
    speakButton.disabled = false;
})();

speakButton.addEventListener('click', async () => {
    const audio_link = "/audio/response.mp3"; // 使用 Flask 路由提供的音頻鏈接

    // 確保 model2 已初始化
    if (model2) {
        // 播放音頻
        const audio = new Audio(audio_link);
        audio.volume = 1;

        // 使用 motion 方法播放音頻和口型同步
        model2.motion("default", 0, 2, {
            sound: audio_link,
            volume: 1,
            expression: 4, // 可以根據需要設定不同的表情
            onFinish: () => {console.log("Voiceline and Animation is over")},
            onError: (err) => {console.log("Error: "+err)},
            crossOrigin: "anonymous"
        });

        // 播放音頻
        audio.play();
    } else {
        alert('Model not initialized');
    }
});
