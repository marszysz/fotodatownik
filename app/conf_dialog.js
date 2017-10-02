'use strict';

var ipc = require('electron').ipcRenderer;

ipc.once('passData', makeTable);
function makeTable (event, data) {
    var table = document.getElementById('changeList');
    Object.keys(data).forEach(src => {
        let dest = data[src] ? data[src] : 'Bez zmiany - data nieznana';
        let row = document.createElement('tr');
        row.innerHTML = `<td>${src}</td><td>${dest}</td>`;
        table.appendChild(row);
    });
    ['ok', 'cancel'].forEach(msg => {
        document.getElementById(msg).addEventListener('click', () => event.sender.send('resp', msg));
    });
}
