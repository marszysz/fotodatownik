'use strict';
const fs = require ('fs');

function listFiles (dir, filterFunc) {
    return fs.readdirSync(dir).filter(filterFunc);
}

function getExifDate (fileName, callback) {
    // reads `date taken` from fileName and passes it to callback
    // in the form of Date object, null if failed
    var fs = require('fs');
    fs.stat(fileName, function(error, stats) {
        if (error) {
            console.log('File ', fileName, ' inaccesible');
            callback(null);
            return null;
        }
        fs.open(fileName, 'r', function(error, fileDescriptor) {
            if (error) {
                console.log('File ', fileName, ' inaccesible');
                callback(null);
                return null;
            }
            var exifEnd = 65635; // the maximum position within the JPEG file where EXIF metadata block could reach
            var exifBuffer = Buffer.allocUnsafe(stats.size < exifEnd ? stats.size : exifEnd);
            fs.read(fileDescriptor, exifBuffer, 0, exifBuffer.length, 0, function(error, bytesRead, buffer) {
                if (error) {
                    console.log('Unable to read file: ', fileName);
                    callback(null);
                    return null;
                }
                var parser = require('exif-parser').create(buffer);
                parser.enableImageSize(false);
                parser.enableSimpleValues(true); // returns UNIX timestamp w. this flag (raw string otherwise)
                var result;
                try {
                    result = parser.parse();
                }
                catch (err) {}
                var exifDate = result && result.tags.DateTimeOriginal ? new Date(result.tags.DateTimeOriginal * 1000) : null;
                if (!exifDate) {
                    var msg = 'EXIF date not present or EXIF unreadable in file: ';
                }
                else {
                    var msg = 'Done with a file: ';
                }
                fs.close(fileDescriptor, error => console.log(msg + fileName));
                callback(exifDate);
                return exifDate;
            });
        });
    });
}

function fileDateMap(dir, fileArray) {
    // returns an object which maps filenames
    // from fileArray located in dir to their EXIF DateCreated dates
    // won't work because of improper mix od sync and async
    // todo: rewrite this (to be fully async?)
    var out = {};
    return fileArray.reduce((prev, current) => {
        var filePath = dir + '/' + current;
        getExifDate(filePath, date => {
            prev[current] = date;
        });
        return prev; 
    }, out );
}