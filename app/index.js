'use strict';

const { dialog, BrowserWindow, getCurrentWindow } = require('electron').remote;
const backend = require('../backend');

document.getElementById('renameFiles').addEventListener('click', renameFiles);
function renameFiles() {
    var resp = dialog.showOpenDialog({
        title: 'Wybierz folder',
        properties: ['openDirectory']
    });
    if (resp) {
        var dir = resp[0];
        var opts = {
            dateSeparator: '-',
            timeSeparator: '.',
            dateTimeSeparator: ' '
        };
        backend.fileRenameMap(dir, fn => /\.jpe?g$/i.test(fn), opts, console.log);
        var dialogWindow = openDialogWindow;
        dialogWindow.webContents.on('did-finish-load', () => {
            // dialogWindow.webContents.send('ping', 'whoooooooh!')
        });
    }
}

function openDialogWindow() {
    var dialogWindow = new BrowserWindow({
        width: 700,
        height: 500,
        parent: getCurrentWindow(),
        modal: true
    });
    dialogWindow.loadURL(`file://${__dirname}/conf_dialog.html`);
    return dialogWindow;
}
