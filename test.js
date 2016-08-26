import test from 'ava';  // AVA insists on ES6 export/import 

const rewire = require('rewire');
const main = rewire('./main');

var listFiles = main.__get__('listFiles');
test('listFiles should return proper file list filtered by the supplied function', t => {
    t.deepEqual(listFiles('testdir', fn => /\.jpe?g$/i.test(fn)), ['1.jpg', 'a.jpg', 'b.jpg', 'c.jpg']);
}); 

var getExifDate = main.__get__('getExifDate');
test.cb('getExifDate should pass `date taken` of a jpg file as an argument to callback', t => {
    getExifDate('testdir/1.jpg', date => {
        t.deepEqual(date, new Date('2011-06-01T07:07:07.000Z'));
        t.end();
    });
});
test.cb("getExifDate should pass null when the file doesn't exist", t => {
    getExifDate('bla.blah', date => { // bla.blah is a non-existent file
        t.is(date, null);
        t.end();
    });
});
test.cb("getExifDate should pass null when the file can't be read", t => {
    getExifDate('testdir/c.jpg', date => { // c.jpg is 0-byte file
        t.is(date, null);
        t.end();
    });
});
test.cb("getExifDate should pass null when it can't access a file", t => {
    getExifDate('testdir/a.jpg', date => { // a.jpg is a file without read permission
        t.is(date, null);
        t.end();
    });
});

test.cb("getExifDate should pass null when the file doesn't contain valid Date field", t => {
    getExifDate('testdir/b.jpg', date => { // b.jpg is a valid JPEG/EXIF file without Date Taken field
        t.is(date, null);
        t.end();
    });
});

var fileDateMap = main.__get__('fileDateMap');
test('fileDateMap should return an object which maps filenames to dates', t => {
    t.deepEqual(fileDateMap('testdir', ['1.jpg', 'b.jpg', 'bla.blah']), 
        {'1.jpg': new Date('2011-06-01T07:07:07.000Z'), 'b.jpg': null, 'bla.blah': null});
});