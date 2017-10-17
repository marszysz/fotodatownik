'use strict';

const remote = require('electron').remote;
const backend = require('../backend');
const util = require('../util');
const path = require('path');

document.getElementById('renameFiles').addEventListener('click', renameFiles);
function renameFiles () {
    var dir = selectDir();
    if (dir) {
        var opts = {
            dateSeparator: '-',
            timeSeparator: '.',
            dateTimeSeparator: ' '
        };
        opts.includeTitle = document.getElementById('fileTitles').checked;
        backend.fileRenameMap(dir, fn => /\.jpe?g$/i.test(fn), opts, confirmRename);
    }
}

document.getElementById('renameDirs').addEventListener('click', renameDirs);
function renameDirs () {
    var dir = selectDir();
    if (dir) {
        var opts = {
            dateSeparator: '.',
            rangeSeparator: '-',
            dayStart: 0
        };
        opts.includeTitle = document.getElementById('dirTitles').checked;
        backend.dirRenameMap(dir, opts, confirmRename);
    }
}

function selectDir () {
    var resp = remote.dialog.showOpenDialog(
        remote.getCurrentWindow(),
        {
            title: 'Wybierz folder',
            properties: ['openDirectory']
        }
    );
    return resp ? resp[0] : null;
}

function openDialogWindow () {
    var dialogWindow = new remote.BrowserWindow({
        width: 700,
        height: 500,
        parent: remote.getCurrentWindow(),
        modal: true
    });
    dialogWindow.loadURL(`file://${__dirname}/confirm_dialog.html`);
    return dialogWindow;
}

function confirmRename (renameMap) {
    if(Object.keys(renameMap).length === 0) {
        return alert('Brak zmian do wykonania w wybranym folderze.');
    }
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
    backend.renameFiles(
        renameMap.baseDir,
        filteredRenameMap,
        showErrors
    );
}

function showErrors (errList) {
    if(! errList || Object.keys(errList).length === 0) {alert('Załatwione.'); return}
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
