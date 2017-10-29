'use strict';

const remote = require('electron').remote;
const config = require('../config');

deploySettings(config.getSettings(), document.getElementById('main'));

document.getElementById('cancelButton').addEventListener('click', closeMe);
function closeMe () {
    remote.getCurrentWindow().close();
}

document.getElementById('saveSettings').addEventListener('click', saveClose);
function saveClose () {
    let settingsObj = buildSettingsObj(document.getElementById('main'));
    config.saveSettings(settingsObj);
}

function buildSettingsObj(parent) {
    function getValue(elem) {
        if(elem.tagName !== 'input') return null;
        return elem.hasAttribute('checked')
            ? elem.getAttribute('checked')
            : elem.getAttribute('value');
    }
    let innerSettings = Array.from(parent.children).filter(el => el.hasAttribute('data-setting'));
    let out = {};
    innerSettings.forEach(el => {
        let settingName = el.getAttribute('data-setting');
        let subSettings = buildSettingsObj(el);
        out[settingName] = subSettings === {} 
            ? getValue(el)
            : subSettings;
    });
    return out;
}

function deploySettings (settingsObj, container) {
    function setValue(elem, value) {
        if(elem.hasAttribute('checked')) {
            elem.setAttribute('checked', value);
        }
        else {
            elem.setAttribute('value', value);
        }
    }
    Object.keys(settingsObj).forEach(key => {
        let subKeys = Object.keys(settingsObj[key]);
        let targetElem = container.querySelector(`input[data-setting="${key}"]`);
        if(subKeys.length === 0) {
            setValue(targetElem, settingsObj[key]);
        }
        else {
            deploySettings(subKeys, targetElem);
        }
    });
}