'use strict';

const remote = require('electron').remote;
const backend = require('../backend');

document.getElementById('renameFiles').addEventListener('click', renameFiles);
function renameFiles() {
    var resp = remote.dialog.showOpenDialog({
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
        backend.fileRenameMap(dir, fn => /\.jpe?g$/i.test(fn), opts, result => {
            var dialogWindow = openDialogWindow();
            dialogWindow.webContents.on('did-finish-load', () => {
                dialogWindow.webContents.send('passData', result);
            });
            remote.ipcMain.once('resp', (ev, msg) => {
                if(msg === 'ok') console.log(result);
                dialogWindow.close();
            });
        });
    }
}

function openDialogWindow() {
    var dialogWindow = new remote.BrowserWindow({
        width: 700,
        height: 500,
        parent: remote.getCurrentWindow(),
        modal: true
    });
    dialogWindow.loadURL(`file://${__dirname}/conf_dialog.html`);
    return dialogWindow;
}
