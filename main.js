'use strict';
const fs = require ('fs');
const exifParser = require('exif-parser');
const moment = require('moment');

const util = require ('./util.js');

function listFiles (dir, filterFunc) {
    return fs.readdirSync(dir).filter(filterFunc);
}

// reads `date taken` from fileName and passes it to callback
// in the form of Date object, null if failed.
// Uses UTC since no timezone is available in DateTimeOriginal tag.
function getExifDate (fileName, callback) {
    if(!callback) throw 'Empty callback';

    fs.stat(fileName, processFile);

    function processFile (error, stats) {
        if (error) {
            console.log('File ', fileName, ' inaccesible');
            callback(null);
            return;
        }
        fs.open(fileName, 'r', processExifBlock.bind(undefined, stats));
    }

    function processExifBlock (stats, error, fileDescriptor) {
        if (error) {
            console.log('File ', fileName, ' inaccesible');
            callback(null);
            return;
        }
        var exifEnd = 65635; // the maximum position within the JPEG file where EXIF metadata block could reach
        var exifBuffer = Buffer.allocUnsafe(stats.size < exifEnd ? stats.size : exifEnd);
        fs.read(fileDescriptor, exifBuffer, 0, exifBuffer.length, 0, parseExif.bind(undefined, fileDescriptor));
    }

    function parseExif (fileDescriptor, error, bytesRead, buffer) {
        if (error) {
            console.log('Unable to read file: ', fileName);
            callback(null);
            return;
        }
        var parser = exifParser.create(buffer);
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
        var msg;
        if (!exifDate) {
            msg = 'EXIF date not present or EXIF unreadable in file: ';
        }
        else {
            msg = 'Done with a file: ';
        }
        fs.close(fileDescriptor, error => console.log(msg + fileName, error ? ' (error on closing)' : ''));
        callback(exifDate);
        return;
    }
}

// calls the callback with an object which maps filenames
// from fileArray located in dir to their EXIF DateCreated dates
function fileDateMap (dir, fileArray, callback) {
    if(!callback) throw 'Empty callback';
    var result = {};
    result.filesPending = fileArray.length;
    Object.defineProperty(result, 'baseDir', {value: dir, enumerable: false});
    fileArray.forEach(gatherDates);
  
    function gatherDates (fileName) {
        var filePath = result.baseDir + '/' + fileName;
        getExifDate(filePath, collectDate.bind(undefined, fileName));
    }

    function collectDate (fileName, date) {
        result[fileName] = date;
        if (--result.filesPending === 0) {
            delete result.filesPending;
            callback(result);
        }
    }
}

/* Composes a new file name from the old one, a date object and options object.
options with defaults:
dateSeparator: '.'  - separator of date parts
timeSeparator: '.'  - separator of time parts
dateTimeSeparator: '_'  - separates date from time
*/
function makeNewFileName (oldFileName, fileDate, options) {
    if(fileDate === null) return null;

    var compose = (src => [src.y, src.ds, src.m, src.ds, src.d, src.dts, src.h, src.ts, src.M, src.ts, src.s].join(''));

    return makeNewName(oldFileName, fileDate, options, compose);
}

/* Composes a new file/dir name based on old name, date (or date range in an array) and options.
Also takes a composition function, which should compose the date part of a new name
based on given object consisting of values with keys:
y - year,
m - month,
d - day,
h - hour,
M - minute,
s - second,
ds - date separator,
ts - time separator,
dts - date-time separator (separates date from time),
rs - range separator (separates a date from another one or its part),
y2 - year of the last contained file,
m2 - month of the last contained file,
d2 - day of the last contained file.
*/
function makeNewName (oldName, dates, options, composeFunc) {
    if(! oldName) throw('Missing oldName argument');
    if(! dates) throw('Missing dates argument');
    if(! options || util.getType(options) !== 'object') throw('Missing or invalid options argument: should be an object.');
    if(! composeFunc || !(composeFunc instanceof Function)) throw('Missing or invalid composeFunc argument: should be a function.');

    var src = {};
    src.ds = options.hasOwnProperty('dateSeparator') ? options.dateSeparator : '.';
    src.ts = options.hasOwnProperty('timeSeparator') ? options.timeSeparator : '.';
    src.dts = options.hasOwnProperty('dateTimeSeparator') ? options.dateTimeSeparator : '_';
    src.rs = options.hasOwnProperty('rangeSeparator') ? options.rangeSeparator : '-';
    var dayStart = options.hasOwnProperty('dayStart') ? options.dayStart : '0';
    if(isNaN(dayStart)) dayStart = 0;

    function padTo2 (nr) {
        nr += '';
        if(nr.length < 2) nr = '0' + nr;
        return nr;
    }
    
    var date1;
    var date2;
    if(util.getType(dates) === 'array') {
        date1 = dates[0].getUTCHours() >= dayStart ? dates[0] : moment(dates[0]).subtract(1, 'day').toDate();
        date2 = dates[1].getUTCHours() >= dayStart ? dates[1] : moment(dates[1]).subtract(1, 'day').toDate(); 
        src.y2 = date2.getUTCFullYear();
        src.m2 = padTo2(date2.getUTCMonth() + 1);  // strange JS month handling (0-indexed)
        src.d2 = padTo2(date2.getUTCDate()); 
    } else {
        date1 = dates;
    }
    src.y = date1.getUTCFullYear();
    src.m = padTo2(date1.getUTCMonth() + 1);
    src.d = padTo2(date1.getUTCDate());
    src.h = padTo2(date1.getUTCHours());
    src.M = padTo2(date1.getUTCMinutes());
    src.s = padTo2(date1.getUTCSeconds());
    var datePart = composeFunc(src);
    var title = extractTitle(oldName);
    // if the title starts with a letter or number, direct appending to the date would be unpleasant
    // (this method is Unicode-safe)
    if(title && (title[0].toLowerCase() !== title[0].toUpperCase() || /\d/.test(title[0]))) {
        title = ' ' + title;
    }
    return datePart + title; 
}

/* Extracts and returns file/dir title from a given file/dir name, if there is one,
empty string otherwise. The title is everything after: the standard filename
(without extension) given by the DCF compliant camera, a date or date range.
*/
function extractTitle (fileName) {
    /* from Wikipedia on DCF specification: 
    Subdirectory names (such as "123ABCDE") consist of a unique directory number (in the range 100…999)
    and five alphanumeric characters, which may be freely chosen.
    These directories contain files with names such as "ABCD1234.JPG"
    that consist of four alphanumeric characters (often "DSC_", "DSC0", "DSCF", "IMG_"/"MOV_", or "P000"),
    followed by a number.
    The file extension is "JPG" for Exif files and "THM" for Exif files that represent thumbnails
    of other files than "JPG".
    */
    var baseNamePattern = /^\w{4}\d+|\d{3}\w{5}|\d{4}\W?\d\d\W?\d\d(-(((\d{4}\W?)?\d\d\W?)?\d\d))?/;
    return fileName.replace(baseNamePattern, '');
}

// Calls callback with generated object which maps filenames to their new names.
// Takes a directory name, filename filter function and options object for makeNewFileName.  
function fileRenameMap (dir, filterFunc, options, callback) {
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

/* Calls callback with a date range array: [start_date end_date]
extracted from files in dir filtered by filterFunc.
*/
function extractDirDateRange (dir, filterFunc, callback) {
    var fileList = null;
    try {
        fileList = listFiles(dir, filterFunc);
    } catch (err) {
        console.log('Error opening directory ', dir, ' - ', err.message);
    }
    if(! fileList) {
        callback(null);
        return;
    } else {
        if(fileList.length === 0) handleDateList(null);
        var dateList = [];
        var filesPending = fileList.length;
        fileList.forEach(collectDate);
    }

    function collectDate (fileName) {
        getExifDate(dir + '/' + fileName, date => {
            if(date !== null) dateList.push(date);
            if(--filesPending === 0) handleDateList(dateList);
        });
    }
    function handleDateList (dateList) {
        if(! dateList || dateList.length === 0) {
            console.log(dir + ' does not contain any file with readable EXIF.');
            callback(null);
            return;
        }
        var dateListSorted;
        if(dateList.length === 1) {
            dateListSorted = dateList.concat(dateList);
        } else {
            dateListSorted = dateList.slice().sort((date1, date2) => date1 - date2);
        }
        var out;
        if(dateList.length > 2) {
            out = dateListSorted.splice(1, dateList.length - 2);
        } else {
            out = dateListSorted;
        }
        callback(out);
    }
}

/* Returns a new name for a directory based on old name, date range (array of 2 dates) and options.
Options with defaults:
dateSeparator: '.'  - separator of date parts
rangeSeparator: '-'  - separates the first date from (a part of) the second one  
dayStart: 0  -  hour which starts a new day (any date with hour < dayStart will be converted to the preceding day) 
*/
function makeNewDirName (oldName, dateRange, options) {
    if(dateRange === null) return null;
    if(util.getType(dateRange) !== 'array' || util.getType(dateRange[0]) !== 'date' || util.getType(dateRange[1]) !== 'date') {
        throw(new Error('dateRange should be an array of 2 dates.'));
    }
    var compose = function (src) {
        var y2s;  // second date's year with appended separator - and so on below
        if(src.y === src.y2) {
            y2s = '';            
        } else {
            y2s = src.y2 + src.ds;            
        }
        var m2s;
        if(src.y === src.y2 && src.m === src.m2) {
            m2s = '';
        } else { 
            m2s = src.m2 + src.ds;
        }
        var d2;
        var rs;
        if(src.y === src.y2 && src.m === src.m2 && src.d === src.d2) {
            d2 = '';
            rs = '';
        } else {
            d2 = src.d2;
            rs = src.rs;                
        }
        return [src.y, src.ds, src.m, src.ds, src.d, rs, y2s, m2s, d2].join('');
    };
    return makeNewName(oldName, dateRange, options, compose);
}

// Calls callback with an object mapping current dir names to their new names.
// Passes options object to makeNewDirName.
function dirRenameMap (outerDir, options, callback) {
    var dirList = fs.readdirSync(outerDir).filter(fn => fs.statSync(outerDir + '/' + fn).isDirectory());
    var dirDateMap = {'pending': dirList.length};
    Object.defineProperty(dirDateMap, 'baseDir', {value: outerDir, enumerable: false});
    dirList.forEach(dirName => {
        var dirPath = outerDir + '/' + dirName;
        extractDirDateRange(dirPath, fn => /\.jpe?g$/i.test(fn), buildDirDateMap.bind(this, dirName));   
    });
    function buildDirDateMap (dirName, dateRange) {
        dirDateMap[dirName] = dateRange;
        if(--dirDateMap.pending === 0) {
            delete dirDateMap.pending;
            buildDirRenameMap(dirDateMap);
        }
    }
    function buildDirRenameMap (dirDateMap) {
        var dirRenameMap = {};
        Object.defineProperty(dirRenameMap, 'baseDir', {value: outerDir, enumerable: false});
        
        Object.keys(dirDateMap).forEach(dirName => {
            dirRenameMap[dirName] = makeNewDirName(dirName, dirDateMap[dirName], options);
        });
        callback(dirRenameMap);
    }
}

// TODO: what about *.thm files and asociated objects, especially videos?
