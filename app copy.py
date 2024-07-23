from flask import Flask, request, jsonify, send_from_directory
import os
import shutil



app = Flask(__name__)

# 設置檔案儲存路徑
UPLOAD_FOLDER = 'uploads'
DESTINATION_FOLDER = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\audio_input"  # 替換為你的目標資料夾
AUDIO_OUTPUT_FOLDER = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\audio_output"  # 替換為你的音頻輸出資料夾

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>錄音功能示範</title>
        <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/pixi.js@6.5.2/dist/browser/pixi.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js"></script>
    </head>
    <body>
        <h1>錄音功能示範</h1>
        <button id="recordButton">開始錄音</button>
        <button id="stopButton" disabled>停止錄音</button>
        <button id="speakButton" disabled>播放音頻並同步口型</button>
        <audio id="audioPlayback" controls></audio>
        <canvas id="canvas" width="500" height="500"></canvas>
        <script>
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

            // 初始化Live2D虛擬人物
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

                model2.scale.set(0.3);

                // 激活播放音頻按鈕
                speakButton.disabled = false;
            })();

            speakButton.addEventListener('click', async () => {
                const audio_link = "/audio/response.mp3"; // 使用Flask路由提供的音頻鏈接

                // 確保model2已經初始化
                if (model2) {
                    // 播放音頻
                    const audio = new Audio(audio_link);
                    audio.volume = 1;

                    // 使用motion方法播放音頻和口型同步
                    model2.motion("default", 0, 2, {
                        sound: audio_link,
                        volume: 1,
                        expression: 4, // 可以根據需要設置不同的表情
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
        </script>
    </body>
    </html>
    '''

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['audio']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    
    # 移動檔案到目標資料夾
    destination_path = os.path.join(DESTINATION_FOLDER, file.filename)
    shutil.move(file_path, destination_path)
    
    return jsonify({'message': 'File uploaded and moved successfully'}), 200

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_OUTPUT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
