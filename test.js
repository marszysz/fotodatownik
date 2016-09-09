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
    getExifDate('not/existing', date => {
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
    fileDateMap('testdir', ['1.jpg', 'b.jpg', 'not/existing'], result => {
        let expected = {'1.jpg': new Date('2011-06-01T07:07:07.000Z'), 'b.jpg': null, 'not/existing': null};
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
    t.is(extractTitle('1.jpg'), '1.jpg');
});

var makeNewFileName = main.__get__('makeNewFileName');
test('makeNewFileName should compose a new file name based on the old name, file date and options', t => {
    t.is(makeNewFileName('DCIM1234.jpg', new Date('2016-01-01T00:00:00.000Z'), {}), '2016.01.01_00.00.00.jpg');
    t.is(makeNewFileName('blah.jpg', new Date('2016-01-01T00:00:00.000Z'), {}), '2016.01.01_00.00.00 blah.jpg');
    t.is(makeNewFileName('DCIM1234 bździąg wa.JPG', new Date('2016-02-02T23:59:59Z'), {}), '2016.02.02_23.59.59 bździąg wa.JPG');
    let opts = {
        dateSeparator: '',
        timeSeparator: ':',
        dateTimeSeparator: '-'
    };
    t.is(makeNewFileName('DCIM1234 sth.jpg', new Date('2016-01-01T00:00:00.999Z'), opts), '20160101-00:00:00 sth.jpg');
});

var fileRenameMap = main.__get__('fileRenameMap');
test.cb('fileRenameMap should pass an object which maps existing filenames to new ones', t => {
    var expected = {
        '1.jpg': '2011.06.01_07.07.07 1.jpg',
        'c.jpg': null,
    }
    fileRenameMap('testdir', fn => /^[1c]\.jpg$/.test(fn), {}, result => {
        t.deepEqual(result, expected);
        t.end();
    });
});

var extractDirDateRange = main.__get__('extractDirDateRange');
test.cb("extractDirDateRange should pass null if a given directory doesn't contain jpeg files with EXIF dates \
    or isn't accesible.", t => {
    extractDirDateRange('testdir/empty', fn => true, result => {
        t.is(result, null);
        t.end();
    });
});
test.cb('extractDirDateRange should pass an array of [min_date max_date]', t => {
    extractDirDateRange('testdir/100TEST_', fn => /\.jpe?g$/i.test(fn), result => {
        t.deepEqual(result, [new Date('2011-06-01T07:07:07.000Z'), new Date('2011-07-23T23:21:03.000Z')]);
        t.end();
    });
});