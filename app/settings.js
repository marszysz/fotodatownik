'use strict';

const remote = require('electron').remote;
const config = require('./config');

document.getElementById('cancel').addEventListener('click', closeMe);
function closeMe () {
    remote.getCurrentWindow().close();
}

