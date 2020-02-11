# TECH.I.S.出席管理システム_ELECTRON

## 概要
TECH.I.S内での生徒の出席を管理するシステムです。  
以前はPython+MySQLで作成していましたが、今後の改修性を考えJavaScriptで作成することにしました。

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
    "domain" : "[kintoneサブドメイン名]", /* https://(サブドメイン名).cybozu.com */
    "token" : "[kintoneAPIトークン]",
    "student_app" : "[生徒マスタアプリID]",
    "attend_app" : "[出席管理アプリID]"
}
```

## アプリケーション起動方法
環境構築後src内で以下のコマンドを入力してください

```
npx electron .
```