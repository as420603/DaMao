from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import shutil

app = Flask(__name__)

# 設置檔案儲存路徑
UPLOAD_FOLDER = 'uploads'
DESTINATION_FOLDER = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\audio_input"  # 替換為你的目標資料夾
AUDIO_OUTPUT_FOLDER = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\audio_output"  # 替換為你的音頻輸出資料夾
TRANSCRIPTION_FILE_PATH = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\txt_to_DaMao\\transcription.txt"  # 替換為你的文字檔案路徑
RESPONSE_FILE_PATH = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\txt_to_TTS\\Da_Mao_response.txt"  # 替換為你的回覆文字檔案路徑

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DESTINATION_FOLDER, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    # 讀取文字檔案內容
    try:
        with open(TRANSCRIPTION_FILE_PATH, 'r', encoding='utf-8') as file:
            transcription_text = file.read()
    except FileNotFoundError:
        transcription_text = "找不到轉換文字檔案。"

    try:
        with open(RESPONSE_FILE_PATH, 'r', encoding='utf-8') as file:
            response_text = file.read()
    except FileNotFoundError:
        response_text = "找不到回覆文字檔案。"

    return render_template('index.html', transcription_text=transcription_text, response_text=response_text)

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
