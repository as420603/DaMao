import os
import time
import shutil
import subprocess
from flask import Flask, request, jsonify, send_from_directory, render_template

# 初始化 Flask 應用
app = Flask(__name__)

# 設置檔案儲存路徑
UPLOAD_FOLDER = 'uploads'
DESTINATION_FOLDER = r"D:\Project_AI\Whisper_Test\venv\final_project\audio_input"
AUDIO_OUTPUT_FOLDER = r"D:\Project_AI\Whisper_Test\venv\final_project\audio_output"
TRANSCRIPTION_FILE_PATH = r"D:\Project_AI\Whisper_Test\venv\final_project\txt_to_DaMao\transcription.txt"
RESPONSE_FILE_PATH = r"D:\Project_AI\Whisper_Test\venv\final_project\txt_to_TTS\Da_Mao_response.txt"

# 創建目錄（如果不存在）
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DESTINATION_FOLDER, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    """主頁面路由，讀取轉換文字檔案和回覆文字檔案的內容，並渲染 index.html 模板。"""
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

@app.route('/process_audio', methods=['POST'])
def process_audio():
    """處理音頻的路由，執行指定的 Python 腳本並返回結果。"""
    try:
        script_path = r"D:\Project_AI\Whisper_Test\venv\final_project\Da_Mao.py"
        result = subprocess.run(['python', script_path], capture_output=True, text=True)
        
        print("DaMao.py stdout:", result.stdout)
        print("DaMao.py stderr:", result.stderr)
        
        if result.returncode == 0:
            return jsonify({'message': '处理成功'}), 200
        else:
            return jsonify({'error': '处理失败', 'details': result.stderr}), 500

    except Exception as e:
        print(f"处理音频时出错: {e}")
        return jsonify({'error': '服务器错误', 'details': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    """上傳音頻檔案的路由，接收音頻檔案並移動到指定目錄。"""
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
    """定時獲取更新的路由，返回最新的轉換文字、回覆文字和音頻 URL。"""
    timestamp = int(time.time())  # 獲取當前的時間戳
    audio_url = f"/audio/response.mp3?t={timestamp}"  # 動態生成帶時間戳的音頻URL
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
        'response_text': response_text,
        'audio_url': audio_url  # 包含音頻URL
    })

@app.route('/audio/<filename>')
def serve_audio(filename):
    """提供音頻檔案的路由，根據文件名從指定目錄返回音頻文件。"""
    return send_from_directory(AUDIO_OUTPUT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
