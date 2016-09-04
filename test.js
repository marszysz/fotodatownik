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
test.cb('fileDateMap should return an object which maps filenames to dates', t => {
    fileDateMap('testdir', ['1.jpg', 'b.jpg', 'bla.blah'], result => {
        var expected = {'baseDir':'testdir', '1.jpg': new Date('2011-06-01T07:07:07.000Z'), 'b.jpg': null, 'bla.blah': null};
        t.deepEqual(result, expected);
        t.end();
    });
});

var extractTitle = main.__get__('extractTitle');
test('extractTitle should return a title (including file extension) extracted from file name', t => {
    t.is(extractTitle('DSCF1234 some fancy title eg. żółć.jpg'), ' some fancy title eg. żółć.jpg');
    t.is(extractTitle('DSCF0000 - sth.JPG'), ' - sth.JPG');
    t.is(extractTitle('Hi guys.JPG'), 'Hi guys.JPG');
    t.is(extractTitle('105NIKON an extraordinarily nice event'), ' an extraordinarily nice event');
    t.is(extractTitle('bździągwa'), 'bździągwa');
    t.is(extractTitle('IMG_1234.jpg'), '.jpg');
})

var makeNewFileName = main.__get__('makeNewFileName');
test('makeNewFileName should compose a new file name based on the old name, file date and options', t => {
    t.is(makeNewFileName('DCIM1234.jpg', new Date('2016-01-01T00:00:00.000Z'), {}), '2016.01.01-00.00.00.jpg');
    t.is(makeNewFileName('DCIM1234 bździąg wa.JPG', new Date('2016-02-02T23:59:59Z'), {}), '2016.02.02-23.59.59 bździąg wa.JPG');
    let opts = {
        dateSeparator: '',
        timeSeparator: ':',
        dateTimeSeparator: '_'
    };
    t.is(makeNewFileName('DCIM1234 sth.jpg', new Date('2016-01-01T00:00:00.999Z'), opts), '20160101_00:00:00 sth.jpg');
})

