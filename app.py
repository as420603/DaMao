import os
import time
import threading
import shutil
from flask import Flask, request, jsonify, send_from_directory, render_template

app = Flask(__name__)

# 設置檔案儲存路徑
UPLOAD_FOLDER = 'uploads'
DESTINATION_FOLDER = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\audio_input"
AUDIO_OUTPUT_FOLDER = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\audio_output"
TRANSCRIPTION_FILE_PATH = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\txt_to_DaMao\\transcription.txt"
RESPONSE_FILE_PATH = "D:\\Project_AI\\Whisper_Test\\venv\\final_project\\txt_to_TTS\\Da_Mao_response.txt"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DESTINATION_FOLDER, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_FOLDER, exist_ok=True)

def check_files():
    while True:
        # 檢查檔案上傳的邏輯
        # 可以在這裡添加你需要的檢查邏輯
        print("檢查檔案上傳...")
        time.sleep(5)

@app.route('/')
def index():
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
    
    destination_path = os.path.join(DESTINATION_FOLDER, file.filename)
    
    # 如果目标文件已存在，先删除
    if os.path.exists(destination_path):
        os.remove(destination_path)

    shutil.move(file_path, destination_path)
    
    return jsonify({'message': 'File uploaded and moved successfully'}), 200

@app.route('/get_updates')
def get_updates():
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

    return jsonify({
        'transcription_text': transcription_text,
        'response_text': response_text
    })

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_OUTPUT_FOLDER, filename)

if __name__ == '__main__':
    threading.Thread(target=check_files, daemon=True).start()
    app.run(debug=True)
