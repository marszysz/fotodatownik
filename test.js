/* eslint-disable quotes */
/*jshint multistr:true */
import test from 'ava';  // AVA insists on ES6 export/import
 
const rewire = require('rewire');
const backend = rewire('./backend');

var listFiles = backend.__get__('listFiles');
test('listFiles should return proper file list filtered by the supplied function', t => {
    t.deepEqual(listFiles('testdir', fn => /\.jpe?g$/i.test(fn)), ['1.jpg', 'a.jpg', 'b.jpg', 'c.jpg']);
}); 

var getExifDate = backend.__get__('getExifDate');
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

var fileDateMap = backend.__get__('fileDateMap');
test.cb('fileDateMap should return an object which maps filenames to dates', t => {
    fileDateMap('testdir', ['1.jpg', 'b.jpg', 'not/existing'], result => {
        let expected = {'1.jpg': new Date('2011-06-01T07:07:07.000Z'), 'b.jpg': null, 'not/existing': null};
        t.deepEqual(result, expected);
        t.end();
    });
});

var extractTitle = backend.__get__('extractTitle');
test('extractTitle should return a title (including file extension) extracted from file name', t => {
    t.is(extractTitle('DSCF1234 some fancy title eg. żółć.jpg'), ' some fancy title eg. żółć.jpg');
    t.is(extractTitle('DSCF0000 - sth.JPG'), ' - sth.JPG');
    t.is(extractTitle('Hi guys.JPG'), 'Hi guys.JPG');
    t.is(extractTitle('105NIKON an extraordinarily nice event'), ' an extraordinarily nice event');
    t.is(extractTitle('bździągwa'), 'bździągwa');
    t.is(extractTitle('IMG_1234.jpg'), '.jpg');
    t.is(extractTitle('1.jpg'), '1.jpg');
});

var makeNewFileName = backend.__get__('makeNewFileName');
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

var fileRenameMap = backend.__get__('fileRenameMap');
test.cb('fileRenameMap should pass an object which maps existing filenames to new ones', t => {
    let expected = {
        '1.jpg': '2011.06.01_07.07.07 1.jpg',
        'c.jpg': null,
    };
    fileRenameMap('testdir', fn => /^[1c]\.jpg$/.test(fn), {}, result => {
        t.deepEqual(result, expected);
        t.end();
    });
});

var extractDirDateRange = backend.__get__('extractDirDateRange');
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
test.cb('extractDirDateRange should pass an array of 2 dates even if dir has 1 file', t => {
    extractDirDateRange('testdir/100TEST_', fn => fn === '1.jpg', result => {
        t.deepEqual(result, [new Date('2011-06-01T07:07:07.000Z'), new Date('2011-06-01T07:07:07.000Z')]);
        t.end();
    });
});
test.cb("extractDirDateRange should pass null if it doesn't have any files to work on", t => {
    extractDirDateRange('testdir/100TEST_', fn => false, result => {
        t.is(result, null);
        t.end();
    });
});

var makeNewDirName = backend.__get__('makeNewDirName');
test("makeNewDirName should return a new dir name made from an old name, an array of date range and options", t => {
    var testData = [
        ['2016-01-01T00:00:00.000Z', '2016-01-02T18:00:00.000Z', '2016.01.01-02'],
        ['2016-01-01T04:00:00.000Z', '2016-02-02T18:00:00.000Z', '2016.01.01-02.02'],
        ['2016-12-31T20:00:00.000Z', '2017-01-01T03:00:00.000Z', '2016.12.31-2017.01.01'],
        ['2016-12-31T20:00:00.000Z', '2016-12-31T00:00:00.000Z', '2016.12.31'],
    ];
    testData.forEach(data => {t.is(makeNewDirName('100TEST_', [new Date(data[0]), new Date(data[1])], {}), data[2]);});
    let opts = {
        dateSeparator: '--',
        rangeSeparator: '::',
        dayStart: '04'
    };
    t.is(makeNewDirName('100TEST_', [new Date(testData[2][0]), new Date(testData[2][1])], opts), '2016--12--31');
    t.is(makeNewDirName('100TEST_-abc', [new Date(testData[1][0]), new Date(testData[1][1])], opts), '2016--01--01::02--02-abc');
    t.is(makeNewDirName('100TEST_ teścior', [new Date(testData[1][0]), new Date(testData[1][1])], {}), '2016.01.01-02.02 teścior');
});

var dirRenameMap = backend.__get__('dirRenameMap');
test.cb("dirRenameMap should pass an object mapping existing dir names to the new names", t => {
    let expected = {
        '100TEST_': '2011.06.01-07.23',
        '101TEST_ test test test': '2012.05.24-28 test test test',  // time of the last file: 2012-05-29 00:10:26
        '102EMPTY': null,
        'No EXIF files at all': null,
        'a mix': '2011.06.01-07.23 a mix'  
    };
    dirRenameMap('testdir', {dayStart: 1}, result => {
        t.deepEqual(result, expected);
        t.end();
    });
});

const fileExists = function (fn) {
    try {
        fs.accessSync(fn);
    } catch (e) {
        return false;
    }
    return true;
};
var renameFiles = backend.__get__('renameFiles');
test.cb("renameFiles should fail if the source doesn't exist", t => {
    var srcFile = 'testdir-exec/nothing';
    renameFiles({[srcFile]: 'testdir-exec/doesnotexist'}, errList => {
        t.true(errList.hasOwnProperty(srcFile));
        t.end();
    });
});
test.cb("renameFiles should rename files, but only if the target doesn't exist", t => {
    // testdir/d is a 0-byte file, testdir/e is a directory
    // testRename renames 1st arg to 2nd and back again, 1st should exist, 2nd shouldn't
    testRename('testdir-exec/d', 'testdir-exec/d.renamed');
    testRename('testdir-exec/e', 'testdir-exec/e.renamed');
    function testRename (fn1, fn2) {
        var nofile = 'testdir-exec/doesnotexist';
        renameFiles({[nofile]: fn1}, errList => {
            t.deepEqual(errList, {[nofile]: 'target exists'}, 'should deny replacing an existing file');
            t.end();
        });
        renameFiles({[fn1]: fn2}, errList => {
            t.plan(5);
            t.deepEqual(errList, {}, 'Renaming should succeed');
            t.true(fileExists(fn2), 'The renamed file should exist');
            renameFiles({[fn2]: fn1}, errList => {
                t.deepEqual(errList, {}, 'Renaming back should succeed');
                t.true(fileExists(fn1), 'The original filename should exist back again');
                t.false(fileExists(fn2), 'The renamed file should exist no more');
                t.end();
            });
        });
    }
    });
