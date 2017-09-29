'use strict';

var ipc = require(electron).ipc;

ipc.on('passData', makeTable);
function makeTable (data) {
    var table = document.getElementById('changeList');
    // ...
}