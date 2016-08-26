import test from 'ava';

// czy nie ma jakiejś sztuczki typu include, żeby nie trzeba było pisać `export` przed każdą funkcją?
// jakieś coś, co by wrzucało treść modułu, nawet bezpośrednio luzem, w zasięg bieżącego skryptu...
// nie działa: import {listFiles} from './main'; // może dlatego nie działa, że był jakiś problem z `export`?...
const rewire = require('rewire');
const main = rewire('./main');

var listFiles = main.__get__('listFiles');
test('listFiles should return proper file list', t => {
    t.deepEqual(listFiles('testdir'), ['1.jpg', 'a.jpg', 'b.jpg', 'c.jpg']);
}); 

var getExifDate = main.__get__('getExifDate');
test.cb('getExifDate should pass `date taken` of a jpg file as an argument to callback', t => {
    getExifDate('testdir/1.jpg', date => {
        t.deepEqual(date, new Date('2011-06-01T07:07:07.000Z'));
        t.end();
    });
});
test.cb("getExifDate should pass null when the file doesn't exist", t => {
    getExifDate('bla.blah', date => {
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
    getExifDate('testdir/a.jpg', date => { //a.jpg is a file without read permission
        t.is(date, null);
        t.end();
    });
});

test.cb("getExifDate should pass null when the file doesn't contain valid Date field", t => {
    getExifDate('testdir/b.jpg', date => { //b.jpg is a file without read permission
        t.is(date, null);
        t.end();
    });
});