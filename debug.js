'use strict';
require('longjohn');
const rewire = require('rewire');
const main = rewire('./main');

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
