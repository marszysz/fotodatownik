'use strict';
const fs = require ('fs');

function listFiles (dir, filterFunc) {
    return fs.readdirSync(dir).filter(filterFunc);
}

function getExifDate (fileName, callback) {
    // reads `date taken` from fileName and passes it to callback
    // in the form of Date object, null if failed
    var fs = require('fs');
    fs.stat(fileName, processFile);

    function processFile (error, stats) {
        if (error) {
            console.log('File ', fileName, ' inaccesible');
            callback(null);
            return;
        }
        fs.open(fileName, 'r', processExifBlock.bind(this, stats));
    }

    function processExifBlock (stats, error, fileDescriptor) {
        if (error) {
            console.log('File ', fileName, ' inaccesible');
            callback(null);
            return;
        }
        var exifEnd = 65635; // the maximum position within the JPEG file where EXIF metadata block could reach
        var exifBuffer = Buffer.allocUnsafe(stats.size < exifEnd ? stats.size : exifEnd);
        fs.read(fileDescriptor, exifBuffer, 0, exifBuffer.length, 0, parseExif.bind(this, fileDescriptor));
    }

    function parseExif (fileDescriptor, error, bytesRead, buffer) {
        if (error) {
            console.log('Unable to read file: ', fileName);
            callback(null);
            return;
        }
        var parser = require('exif-parser').create(buffer);
        parser.enableImageSize(false);
        parser.enableSimpleValues(true); // returns UNIX timestamp w. this flag (raw string otherwise)
        var result;
        try {
            result = parser.parse();
        }
        catch (err) {}
        var exifDate = result && result.tags.DateTimeOriginal ?
                new Date(result.tags.DateTimeOriginal * 1000) :
                null;
        if (!exifDate) {
            var msg = 'EXIF date not present or EXIF unreadable in file: ';
        }
        else {
            var msg = 'Done with a file: ';
        }
        fs.close(fileDescriptor, error => console.log(msg + fileName, error ? ' (error on closing)' : null));
        callback(exifDate);
        return;
    }
}

function fileDateMap (dir, fileArray, callback) {
    // calls the callback with an object which maps filenames
    // from fileArray located in dir to their EXIF DateCreated dates
    var result = {};
    result.filesPending = fileArray.length;
    result.baseDir = dir;
    fileArray.forEach(gatherDates);
  
    function gatherDates (fileName) {
        var filePath = result.baseDir + '/' + fileName;
        getExifDate(filePath, collectDate.bind(this, fileName));
    }

    function collectDate (fileName, date) {
        result[fileName] = date;
        if (--result.filesPending === 0) {
            delete result.filesPending;
            callback(result);
        }
    }
}