import test from 'ava';

// czy nie ma jakiejś sztuczki typu include, żeby nie trzeba było pisać `export` przed każdą funkcją?
// jakieś coś, co by wrzucało treść modułu, nawet bezpośrednio luzem, w zasięg bieżącego skryptu...
// nie działa: import {listFiles} from './main'; // może dlatego nie działa, że był jakiś problem z `export`?...
const main = require('./main');

// trochę głupawy test, ale o trzeciej nad ranem nie miałem lepszego pomysłu
test('listFiles should return proper file list', t => {
    t.deepEqual(main.listFiles('testdir'), ['1.jpg', 'a.jpg', 'b.jpg']);
}); 

// getEXIFdate
test('getExifDate should return `date taken` of a jpg file', t => {
    main.getExifDate('testdir/1.jpg', (date) => {
        t.deepEqual(date, new Date(2011, 6, 1, 7, 7, 7))
    });
});

// test.todo ('write some tests');
