'use strict';

const fs = require('graceful-fs');
const rm = require('rimraf');

fs.readdirSync('./dist')
    .filter(fn => fs.lstatSync('./dist/' + fn).isDirectory())
    .forEach(fn => rm('./dist/' + fn, {disableGlob: true}, err => err && console.warn(err)));