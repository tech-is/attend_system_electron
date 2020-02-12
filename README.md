# TECH.I.S.出席管理システム_ELECTRON

## 概要
TECH.I.S内での生徒の出席を管理するシステムです。  
以前はPython+MySQLで作成していましたが、今後の改修性を考えNode.js+JavaScriptで作成することにしました。

## ダウンロード
```
git clone https://github.com/tech-is/attend_system_electron.git
```

## 環境構成
```
- node.js >= 12.14.1
- npm >= 6.13.4
```

## ファイルツリー
```
src
 ├─ assets/
 │   ├─ css/
 │   ├─ img/
 │   ├─ js/
 │   └─ lib/
 ├─ config/
 │   └─ config.json.example //kintoneとの連携用設定初期ファイル
 ├─ index.html アプリケーションView部分
 ├─ index.js アプリケーション本体
 ├─ package-lock.json
 └─ package.json
```

## 環境構築
src内でpackage.jsonをインストールしてください

```
$ cd src
$ npm install
```

## Kintone設定
/src/config/config.json.exampleをコピーしてsrc/config/config.jsonを作成してください

```
$ cp src/config/config.json.example src/config/config.json
```

コピー後はkintoneのサブドメイン名とアプリID,APIトークンを設定してください

```
{
    "subdomain" : "[kintoneサブドメイン名]", /* https://(サブドメイン名).cybozu.com */
    "student_token": "[生徒マスタアプリAPIトークン]",
    "attend_token": "[出席管理アプリAPIトークン]",
    "student_app" : "[生徒マスタアプリID]",
    "attend_app" : "[出席管理アプリID]"
}
```
kintone HttpRequest 詳細  
>公式リファレンス  
https://developer.cybozu.io/hc/ja/articles/360000313406-kintone-REST-API%E4%B8%80%E8%A6%A7


リクエストパラメータ  

fetchStudent

|  パラメータ名  |  指定する値  |  説明  |
| ---- | ---- | ---- |
|  app  |  [生徒マスタアプリID]  |  生徒マスタアプリIDを記入  |
|  query  |  barcode = "' [スキャンしたバーコードの値] '" |  スキャンしたバーコードの読み取り値をクエリで検索する  |
|  fields[0]  |  $id  |  kintone上での生徒ID  |
|  fields[1]  |  $Name  |  生徒名  |
|  totalCount  |  true  |  真偽値又は文字列  |

fetch_kintone_record

|  パラメータ名  |  指定する値  |  説明  |
| ---- | ---- | ---- |
|  app  |  [出席管理アプリID]  |  出席管理アプリIDIDを記入  |
|  query  |  student_id = [fetchStudentで取得した生徒ID] and  and attend_at > [今日(YYYY-mm-ddTT00:00:00+0900)] attend_at < [翌日(YYYY-mm-ddTT00:00:00+0900)] attend_status in ("\出席中\")|  今現在出席している生徒がいるかどうかをクエリで検索する  |
|  fields[0]  |  record_id  |  kintone上でのレコード番号  |
|  totalCount  |  true  | 真偽値又は文字列

insert_kintone_record

```
"app": [出席管理アプリID]
    "record": {
        "student_id": {
            "value": [fetchStudentで取得した生徒ID]
        },
        "attend_at": {
            "value": [スキャンした時間をISO 8601で記述]
        },
        "attend_status": {
            "value": "出席中"
        }
    }
```

update_kintone_record

```
"app":  [出席管理アプリID],
    "id": [fetch_kintone_recordで取得したID],
    "record": {
        "left_at": {
            "value": [スキャンした時間をISO 8601で記述]
        },
        "attend_status": {
            "value": "退席済"
        }
    }
```

## アプリケーション起動方法
環境構築後src内で以下のコマンドを入力してください

```
npx electron .
```