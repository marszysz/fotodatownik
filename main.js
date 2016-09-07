'use strict';
const fs = require ('fs');

function listFiles (dir, filterFunc) {
    return fs.readdirSync(dir).filter(filterFunc);
}

function getExifDate (fileName, callback) {
    // reads `date taken` from fileName and passes it to callback
    // in the form of Date object, null if failed.
    // Uses UTC since no timezone is available in DateTimeOriginal tag.

    if(!callback) throw 'Empty callback';

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
    if(!callback) throw 'Empty callback';
    var result = {};
    result.filesPending = fileArray.length;
    Object.defineProperty(result, 'baseDir', {value: dir});
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

function makeNewFileName (oldFileName, fileDate, options) {
    /* Composes a new file name from the old one, a date object and options object.
    options with defaults:
    dateSeparator: '.'  - separator of date parts
    timeSeparator: '.'  - separator of time parts
    dateTimeSeparator: '_'  - separates date from time
    */
    var ds = options.hasOwnProperty('dateSeparator') ? options.dateSeparator : '.';
    var ts = options.hasOwnProperty('timeSeparator') ? options.timeSeparator : '.';
    var dts = options.hasOwnProperty('dateTimeSeparator') ? options.dateTimeSeparator : '_';

    function fillTo2 (nr) {
        nr += '';
        if(nr.length < 2) nr = '0' + nr;
        return nr;
    }
    var y = fileDate.getUTCFullYear();
    var m = fillTo2(fileDate.getUTCMonth() + 1);  // strange JS month handling (0-11)
    var d = fillTo2(fileDate.getUTCDate());
    var h = fillTo2(fileDate.getUTCHours());
    var M = fillTo2(fileDate.getUTCMinutes());
    var s = fillTo2(fileDate.getUTCSeconds());
    var datePart = [y, ds, m, ds, d, dts, h, ts, M, ts, s].join('');
    var title = extractTitle(oldFileName);
    // if the title starts with a letter or number, direct appending to the date would be unpleasant
    // (this method is Unicode-safe)
    if(title[0].toLowerCase() !== title[0].toUpperCase() || /\d/.test(title[0])) {
        title = ' ' + title;
    }
    return datePart + title;
}

function extractTitle (fileName) {
    // Extracts and returns file/dir title from a given file/dir name, if there is one,
    // empty string otherwise. The title is everything after: the standard filename
    // (without extension) given by the DCF compliant camera, a date or date range.

    /* from Wikipedia on DCF specification: 
    Subdirectory names (such as "123ABCDE") consist of a unique directory number (in the range 100…999)
    and five alphanumeric characters, which may be freely chosen.
    These directories contain files with names such as "ABCD1234.JPG"
    that consist of four alphanumeric characters (often "DSC_", "DSC0", "DSCF", "IMG_"/"MOV_", or "P000"),
    followed by a number.
    The file extension is "JPG" for Exif files and "THM" for Exif files that represent thumbnails
    of other files than "JPG".
    */

    var pattern = /^\w{4}\d+|\d{3}\w{5}|\d{4}\W?\d\d\W?\d\d(-(((\d{4}\W?)?\d\d\W?)?\d\d))?/;
    return fileName.replace(pattern, '');
}

function fileRenameMap (dir, filterFunc, options, callback) {
    // Calls callback with generated object which maps filenames to their new names.
    // Takes a directory name, filename filter function and options object for makeNewFileName.  

    if(!callback) throw 'Empty callback';

    var fileList = listFiles(dir, filterFunc);
    fileDateMap(dir, fileList, generateRenameMap);
    
    function generateRenameMap (dateMap) {
        var result = {};
        Object.keys(dateMap).forEach(fileName => {
            if(dateMap[fileName]) {
                result[fileName] = makeNewFileName(fileName, dateMap[fileName], options);
            } else {
                result[fileName] = null;
            }
        });
        callback(result);
    }
}

// todo: what about *.thm files and asociated objects, especially videos?
