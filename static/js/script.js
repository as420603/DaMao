document.addEventListener('DOMContentLoaded', () => {
    let recordButton = document.getElementById('recordButton');
    let stopButton = document.getElementById('stopButton');
    let playRecordingButton = document.getElementById('playRecordingButton');
    let mediaRecorder;
    let audioChunks = [];
    let currentAudio = null;
    let isAudioPlaying = false;
    let isRecording = false;

    async function fetchUpdates() {
        try {
            let response = await fetch('/get_updates');
            let data = await response.json();
            document.getElementById('transcription_text').textContent = data.transcription_text;
            document.getElementById('response_text').textContent = data.response_text;
            latestAudioUrl = data.audio_url;  // 獲取最新的音頻URL
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

            if (model2) model2.stopSpeaking();
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

    function playAudio() {
        if (isRecording) return;

        stopAllAudio();

        // 為了避免緩存問題，加入當前時間戳
        const timestamp = new Date().getTime();
        const audio_link = `/audio/response.mp3?t=${timestamp}`;
        
        currentAudio = new Audio(audio_link);
        currentAudio.crossOrigin = "anonymous";
        currentAudio.play().then(() => {
            isAudioPlaying = true;
            model2.speak(audio_link, {
                volume: 1,
                expression: 3,
                resetExpression: true,
                crossOrigin: "anonymous"
            }).catch(error => console.error('Failed to play audio:', error));
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
    }

    setInterval(fetchUpdates, 3000);

    setup();
});
