# 專案名稱

Da_Mao(大毛導覽員)

## 專案簡介

此專案的目標開發出一個大毛導覽人員,可以放在特定場域(ex:1.5旗艦場館)進行導覽,當今天有客人來,他可以進行場館導覽並與客人互動、回答問題、販售票卷。


## 專案結構

簡要說明專案目錄結構。

project-root/
│
├── audio_input
│   ├── recording.wav
│
├── audio_output
│   ├── response.mp3
│
├── static/
│   ├── css
│   │   ├── style.css
│   │
│   ├── js
│   │   ├── script.js
│
├── templates/
│   ├── index.html
│
├── txt_to_DaMao
│   ├── transcription.txt
│
├── txt_to_TTS
│   ├── Da_Mao_response.txt
│
├── uploads/
│
├── app.py
├── Da_Mao.py
├── requirements.txt
├── README.md

## 安裝說明

- git clone https://github.com/as420603/DaMao.git

## 設置虛擬環境
- 1.創建虛擬環境：
    
    python -m venv venv

- 2.激活虛擬環境：

    venv\Scripts\activate

- 3.安裝依賴項：

    pip install -r requirements.txt

## 全局環境訊息

- python version ： 3.12.4

## 操作系統

- Windows 11

## 開發工具

- Visual Studio Code version ： 1.91.1

## 項目依賴

- 需要專案執行環境都在'requirements.txt'文件中,安裝步驟請依照上述操作。

## 使用說明

- 開啟終端機然後進入你的專案資料夾位置,並執行app.py這個檔案

- python app.py 

- 然後開啟網頁進入 http://127.0.0.1:5000 即可開始與大毛互動。

