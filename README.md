# 專案名稱

Da_Mao(大毛導覽員)

## 專案簡介

此專案的目標開發出一個大毛導覽人員,可以放在特定場域(ex:1.5旗艦場館)進行導覽,當今天有客人來,他可以進行場館導覽並與客人互動、回答問題、販售票卷。

## 安裝說明

 git clone https://github.com/as420603/DaMao.git

## 設置虛擬環境

- 1.創建虛擬環境：
    
    python -m venv venv
   
- 2.激活虛擬環境：

    venv\Scripts\activate

- 3.安裝依賴項：
   
    pip install -r requirements.txt
    
- 4.進入連結下載訓練好的大毛模型 ： unsloth.Q4_K_M.gguf

  https://drive.google.com/file/d/1WAR6o36HQU3QffMxtAjpiFgodg28mTke/view?usp=drive_link

- 5.進入專案資料夾並開啟終端機執行以下程式碼

  ollama create Dig_Mao -f Modelfile



## 全局環境訊息

- python version ： 3.12.4

## 操作系統

- Windows 11

## 開發工具

- Visual Studio Code version ： 1.91.1

## 項目依賴

- 需要專案執行環境都在'requirements.txt'文件中,安裝步驟請依照上述操作。

## 使用說明

- 1. 進入專案資料夾並開啟終端機執行以下程式碼

  python app.py

- 2. 開啟以下網頁進入,即可開始與大毛互動

   http://127.0.0.1:5000 

