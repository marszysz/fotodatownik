'use strict';

const remote = require('electron').remote;
const backend = require('../backend');
const util = require('../util');
const path = require('path');
const config = require('../config');

const fileTitlesChk = document.getElementById('fileTitles');
fileTitlesChk.addEventListener('change', ev => {
    config.saveSettings({files: {includeTitle: ev.target.checked}});
});
fileTitlesChk.checked = config.getSettings().files.includeTitle;

const dirTitlesChk = document.getElementById('dirTitles');
dirTitlesChk.addEventListener('change', ev => {
    config.saveSettings({dirs: {includeTitle: ev.target.checked}});
});
dirTitlesChk.checked = config.getSettings().dirs.includeTitle;

document.getElementById('renameFiles').addEventListener('click', renameFiles);
function renameFiles () {
    var dir = selectDir();
    if (dir) {
        var opts = config.getSettings().files;
        var filter = fn => /\.jpe?g$/i.test(fn);
        backend.fileRenameMap(dir, filter, opts, confirmRename);
    }
}

document.getElementById('renameDirs').addEventListener('click', renameDirs);
function renameDirs () {
    var dir = selectDir();
    if (dir) {
        var opts = config.getSettings().dirs;
        backend.dirRenameMap(dir, opts, confirmRename);
    }
}

document.getElementById('openSettings').addEventListener('click', openSettings);
function openSettings () {
    var dialogWindow = new remote.BrowserWindow({
        width: 800,
        height: 690,
        parent: remote.getCurrentWindow()
    });
    dialogWindow.loadURL(`file://${__dirname}/settings.html`);
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
