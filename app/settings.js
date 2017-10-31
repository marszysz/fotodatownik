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
    // remote.getCurrentWindow().close();
    console.log(settingsObj);
}

// autorze, nie idź tą drogą...
// branch jest do wywalenia, albo trzeba zmienić te funkcje poniżej na prostsze:
// zamiast polegać na hierarchicznej strukturze pliku settings.html, lepiej zrobić
// płaskie atrybuty data-setting z hierarchicznymi wartościami ("file.dateSeparator" itd.)
// Zaprawdę, słuszność ma Rossum: "flat is better than nested", czy jakoś tak.
function buildSettingsObj(parent) {
    function getValue(elem) {
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
        let subSetting = settingsObj[key];
        let targetElem = container.querySelector(`[data-setting="${key}"]`);
        let elemType;
        try {
            elemType = targetElem.tagName;
        }
        catch (e) {
            elemType = null;
        }
        if(elemType === 'INPUT') {
            setValue(targetElem, subSetting);
        }
        else if (elemType) {
            deploySettings(subSetting, targetElem);
        }
    });
}