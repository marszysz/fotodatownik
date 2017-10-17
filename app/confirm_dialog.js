'use strict';

const ipc = require('electron').ipcRenderer;
const htmlspecialchars = require('htmlspecialchars');

ipc.once('passData', makeTable);
function makeTable (event, data) {
    var tableBody = document.getElementById('changeList');
    Object.keys(data).forEach(src => {
        let dest = data[src] ?
            htmlspecialchars(data[src]) :
            '<span class="special">Bez zmiany - data nieznana</span>';
        let row = document.createElement('tr');
        row.innerHTML = `<td>${htmlspecialchars(src)}</td><td>${dest}</td>`;
        tableBody.appendChild(row);
    });
    ['ok', 'cancel'].forEach(msg => {
        document.getElementById(msg).addEventListener('click', () => event.sender.send('resp', msg));
    });
}
