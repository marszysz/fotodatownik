'use strict';
const rewire = require('rewire');
const main = rewire('./main');

// var getExifDate = main.__get__('getExifDate');
// getExifDate('testdir/1.jpg', console.log.bind(console));

var fileDateMap = main.__get__('fileDateMap');
console.log(fileDateMap('testdir', ['1.jpg', 'b.jpg', 'bla.blah']));