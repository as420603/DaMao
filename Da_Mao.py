import whisper
import torch
import os
import ollama
from gtts import gTTS

def transcribe_audio(file_path, model_name="medium", use_cuda=True):
    # 檢查是否有可用的 CUDA 設備
    device = "cuda" if use_cuda and torch.cuda.is_available() else "cpu"
    print(f"使用設備: {device}")

    # 初始化 Whisper 模型
    model = whisper.load_model(model_name, device=device)

    # 使用 Whisper 模型進行語音轉文字
    result = model.transcribe(file_path)

    # 返回轉寫結果的文本
    return result["text"]

def generate_tts(text, output_path):
    try:
        tts = gTTS(text=text, lang='zh-tw')
        tts.save(output_path)
        print(f"語音檔案已保存至 {output_path}")
    except Exception as e:
        print(f"生成語音檔案時發生錯誤: {e}")

if __name__ == "__main__":
    # 指定要轉寫的音頻文件路徑
    audio_file_path = r"C:\Users\趙宸葳\Mybot2\DaMao\audio_input\recording.wav"

    # 設置輸出資料夾路徑
    output_folder = r"C:\Users\趙宸葳\Mybot2\DaMao\audio_output"
    RESPONSE_FILE_PATH = r"C:\Users\趙宸葳\Mybot2\DaMao\txt_to_DaMao\transcription.txt"
    TRANSCRIPTION_FILE_PATH = r"C:\Users\趙宸葳\Mybot2\DaMao\txt_to_TTS\Da_Mao_response.txt"

    if os.path.exists(audio_file_path):
        # 語音轉文字
        transcription = transcribe_audio(audio_file_path, model_name="medium", use_cuda=True)
        print("轉寫結果：", transcription)

        # 將語音轉文字的回覆保存到指定文件
        with open(TRANSCRIPTION_FILE_PATH, "w", encoding="utf-8") as file:
            file.write(transcription)
        
        # 使用 Ollama 生成文本回覆
        try:
            response = ollama.chat(
<<<<<<< HEAD
                model='Da_Mao:latest ', #指定我們訓練好的model_name 
=======
                model='Dig_Mao:latest ', #指定我們訓練好的model_name 
>>>>>>> ebc3186f4965fb3303dd2f0bd5c8093fda098c59
                messages=[{'role': 'user', 'content': transcription}]
            )
            
            # 檢查 AI 的回應，取得回覆的內容
            if 'message' in response and 'content' in response['message']:
                output = response['message']['content']
            else:
                print("AI 回覆生成失敗！")
                output = ""
        except Exception as e:
            print(f"生成 AI 回覆時發生錯誤: {e}")
            output = ""

        # 打印 Big_Mao 的回覆
        print("Big_Mao 的回覆: ", output)

        # 將 Big_Mao 的回覆保存到指定文件
        with open(RESPONSE_FILE_PATH, "w", encoding="utf-8") as file:
            file.write(output)
        
        # 將回覆轉換為語音並保存到指定資料夾
        if output:
            output_audio_path = os.path.join(output_folder, "response.mp3")
            generate_tts(output, output_audio_path)

    else:
        print(f"音頻文件 {audio_file_path} 不存在。")
