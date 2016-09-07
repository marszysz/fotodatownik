'use strict';
const rewire = require('rewire');
const main = rewire('./main');

// var getExifDate = main.__get__('getExifDate');
// getExifDate('testdir/1.jpg', console.log.bind(console));

var fileRenameMap = main.__get__('fileRenameMap');
fileRenameMap('testdir', fn => /\.jpg$/i.test(fn), {}, console.log.bind(console));
