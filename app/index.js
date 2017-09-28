'use strict';

const dialog = require('electron').remote.dialog;
const backend = require('../backend');

function renameFiles () {
    var dir = dialog.showOpenDialog({
        title: 'Wybierz folder',
        properties: ['openDirectory']
    })[0];
    backend.fileRenameMap(dir, f => f, {}, console.log);
}

document.getElementById('renameFiles').addEventListener('click', renameFiles);