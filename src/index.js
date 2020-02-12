// Electronのモジュール
const { app, BrowserWindow } = require("electron");
let win;

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

function createWindow() {
    // メイン画面の表示。ウィンドウの幅、高さを指定できる
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('index.html');
    // デベロッパーツール起動
    //win.webContents.openDevTools();
}

app.on('ready', createWindow);

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})