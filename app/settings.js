'use strict';

const remote = require('electron').remote;
const deepmerge = require('deepmerge');
const config = require('../config');

let settingWidgets = Array.from(document.querySelectorAll('[data-setting]'));

document.getElementById('cancelButton').addEventListener('click', closeMe);
function closeMe () {
    remote.getCurrentWindow().close();
}

document.getElementById('saveSettings').addEventListener('click', saveClose);
function saveClose () {
    let settingsObj = collectSettings(settingWidgets);
    config.saveSettings(settingsObj);
    remote.getCurrentWindow().close();
}

deploySettings(config.getSettings(), settingWidgets);

function collectSettings(settingWidgets) {
    function getValue(elem) {
        let valueField = elem.hasAttribute('checked') ? 'checked' : 'value';
        return elem[valueField];
    }
    let settingsObj = deepmerge.all(settingWidgets.map(el => el
        .getAttribute('data-setting')
        .split('.')
        .reduceRight((acc, currLvl) => ({[currLvl]: acc}), getValue(el))
    ));
    return settingsObj;
}

function deploySettings (settingsObj, settingWidgets) {
    function setValue(elem, value) {
        let valueField = elem.hasAttribute('checked') ? 'checked' : 'value';
        elem[valueField] = value;
    }
    settingWidgets.forEach(el => {
        let data = settingsObj;
        let value = eval('data.' + el.getAttribute('data-setting'));
        setValue(el, value);
    });
}