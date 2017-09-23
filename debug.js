'use strict';
// require('longjohn'); 
const rewire = require('rewire');
const backend = rewire('./backend');

// var getExifDate = main.__get__('getExifDate');
// getExifDate('testdir/1.jpg', console.log.bind(console));

//var fileRenameMap = main.__get__('fileRenameMap');
//fileRenameMap('testdir', fn => /\.jpg$/i.test(fn), {}, console.log.bind(console));

/*
var extractDirDateRange = main.__get__('extractDirDateRange');
extractDirDateRange('testdir/100TEST_', fn => false, result => {
    console.log(result);
});
*/

/* 
var makeNewDirName = main.__get__('makeNewDirName');
var testRange = [new Date('2016-01-01T00:00:00.000Z'), new Date('2016-01-02T18:00:00.000Z')];
console.log(makeNewDirName('100TEST_', testRange, {})) // should be '2016.01.01-02';
*/

/* backend.__get__('renameFiles')({'testdir-exec/e': 'testdir-exec/e.renamed'}, errList => {
    console.log(errList);
}); */

const fs = require('graceful-fs');
const fileExists = function (fn) {
    try {
        fs.accessSync(fn);
    } catch (e) {
        return false;
    }
    return true;
};
console.log(__dirname);
console.log(fileExists('testdir-exec/e.renamed'));
return;