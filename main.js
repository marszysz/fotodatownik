'use strict';
const electron = require('electron');
const app = electron.app;
const isDev = require('electron-is-dev');
if(isDev) require('electron-reload')(__dirname);

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 650,
		height: 450
	});

	win.loadURL(`file://${__dirname}/app/index.html`);
	win.on('closed', onClosed);
	// win.setMenu(null);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});
