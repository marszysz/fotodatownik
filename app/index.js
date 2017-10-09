'use strict';

const remote = require('electron').remote;
const backend = require('../backend');
const util = require('../util');
const path = require('path');

document.getElementById('renameFiles').addEventListener('click', renameFiles);
function renameFiles() {
    var resp = remote.dialog.showOpenDialog(
        remote.getCurrentWindow(),
        {
            title: 'Wybierz folder',
            properties: ['openDirectory']
        }
    );
    if (resp) {
        var dir = resp[0];
        var opts = {
            dateSeparator: '-',
            timeSeparator: '.',
            dateTimeSeparator: ' '
        };
        opts.includeTitle = document.getElementById('fileTitles').checked;
        backend.fileRenameMap(dir, fn => /\.jpe?g$/i.test(fn), opts, confirmRename);
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

function confirmRename (renameMap) {
    var dialogWindow = openDialogWindow();
    dialogWindow.webContents.on('did-finish-load', () => {
        dialogWindow.webContents.send('passData', renameMap);
    });
    remote.ipcMain.once('resp', (ev, msg) => {
        if(msg === 'ok') execRename(renameMap);
        dialogWindow.close();
    });
}

function execRename (renameMap) {
    var filteredRenameMap = util.filterObject(renameMap, fn => renameMap[fn] !== null);
    var dir = renameMap.baseDir + '/';
    var fullPathRenameMap = util.mapObject(filteredRenameMap, f => [dir + f[0], dir + f[1]]);
    backend.renameFiles(
        fullPathRenameMap,
        showErrors
    );
}

function showErrors (errList) {
    if(! errList || Object.keys(errList).length === 0) return;
    remote.dialog.showMessageBox(
        remote.getCurrentWindow(),
        {
            type: 'warning',
            buttons: ['OK'],
            message: 'Błąd podczas zmiany nazwy:',
            detail: Object.keys(errList).slice(0, 50).map(fn => path.basename(fn)).join(', ')
        }
    );
}
