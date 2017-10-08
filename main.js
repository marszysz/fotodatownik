'use strict';
const electron = require('electron');
const app = electron.app;

require('electron-reload')(__dirname);

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 600,
		height: 400
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

// TODO: use Photon or Quasar or CSS Grid Layout (at a pinch)
// TODO: find about possibility of cross-platform shell integration

// TODO: undo history stored in settings?