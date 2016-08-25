import test from 'ava';

// czy nie ma jakiejś sztuczki typu include, żeby nie trzeba było pisać `export` przed każdą funkcją?
// jakieś coś, co by wrzucało treść modułu, nawet bezpośrednio luzem, w zasięg bieżącego skryptu...
// nie działa: import {listFiles} from './main'; // może dlatego nie działa, że był jakiś problem z `export`?...
const main = require('./main');

// trochę głupawy test, ale o trzeciej nad ranem nie miałem lepszego pomysłu
test('listFiles should return proper file list', t => {
    t.deepEqual(main.listFiles('testdir'), ['1.jpg', 'a.jpg', 'b.jpg', 'c.jpg']);
}); 

// getEXIFdate
test.cb('getExifDate should pass `date taken` of a jpg file as an argument to callback', t => {
    main.getExifDate('testdir/1.jpg', date => {
        t.deepEqual(date, '2011:06:01 07:07:07');
        t.end();
    });
});
test.cb("getExifDate should pass null when the file doesn't exist", t => {
    main.getExifDate('bla.blah', date => {
        t.is(date, null);
        t.end();
    });
});
test.cb("getExifDate should pass null when the file can't be read", t => {
    main.getExifDate('testdir/c.jpg', date => { // c.jpg is 0-byte file
        t.is(date, null);
        t.end();
    });
});
test.cb("getExifDate should pass null when it can't access a file", t => {
    main.getExifDate('testdir/a.jpg', date => { //a.jpg is a file without read permission
        t.is(date, null);
        t.end();
    });
});