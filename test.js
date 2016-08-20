import test from 'ava';

// czy nie ma jakiejś sztuczki typu include, żeby nie trzeba było pisać `export` przed każdą funkcją?
// jakieś coś, co by wrzucało treść modułu, nawet bezpośrednio luzem, w zasięg bieżącego skryptu...
// nie działa: import {listFiles} from './main'; // może dlatego nie działa, że był jakiś problem z `export`?...
var main = require('./main');

// trochę głupawy test, ale o trzeciej nad ranem nie miałem lepszego pomysłu
test('listFiles should return proper file list', t => {
    t.is(main.listFiles('testdir'), ['1.jpg', 'a.jpg', 'b.jpg']);
});

// test.todo ('write some tests');
