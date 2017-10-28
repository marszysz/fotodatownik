'use strict';

const fs = require('graceful-fs');
const path = require('path');
const deepmerge = require('deepmerge');

const defaultSettingsFile = 'fotodatownik.json';
const DEFAULTS = {
    files: {
        dateSeparator: '-',
        timeSeparator: '.',
        dateTimeSeparator: ' ',
        includeTitle: true
    },
    dirs: {
        dateSeparator: '.',
        rangeSeparator: '-',
        dayStart: 0,
        includeTitle: true
    }
};

module.exports = {DEFAULTS, getSettings, saveSettings};

function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
const settingsFile = path.join(getUserHome(), defaultSettingsFile);

function getSettings (fn=settingsFile) {
    var settings;
    try {
        settings = JSON.parse(fs.readFileSync(fn, 'utf8'));
    }
    catch (e) {
        console.warn('Error reading settings file.');
        settings = DEFAULTS;
    }

    return settings;
}

function saveSettings (settingsObj, fn=settingsFile) {
    let settings = deepmerge(getSettings(fn), settingsObj);
    let out = null;
    try {
        fs.writeFileSync(fn, JSON.stringify(settings), 'utf8');
    } catch (e) {
        console.warn('Error writing settings file.');
        out = e;
    }

    return out;
}
