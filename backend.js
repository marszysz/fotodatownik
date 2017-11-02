'use strict';

module.exports = {fileRenameMap, dirRenameMap, renameFiles, makeNewFileName, makeNewDirName};

const fs = require ('graceful-fs');
const path = require('path');
const exifParser = require('exif-parser');
const moment = require('moment');

const util = require ('./util');

function listFiles (dir, filterFunc) {
    return fs.readdirSync(dir).filter(filterFunc);
}
// checks if the file is a directory OR a symlink to a directory;
// try-catch is for handling broken symlinks - they cause statObj.isDirectory() to throw ENOENT.
function isDirectory (fn) {
    try {
        return fs.statSync(fn).isDirectory();
    } catch (error) {
        return false;
    }
}

// reads `date taken` from fileName (full path) and passes it to callback
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
        catch (err) {
            console.warn('Error parsing EXIF in ' + fileName);
        }
        var exifDate = result && result.tags.DateTimeOriginal ?
            new Date(result.tags.DateTimeOriginal * 1000) :
            null;
        var msg = null;
        if (!exifDate) {
            msg = 'EXIF date not present or EXIF unreadable in file: ';
        }
        function logFileErr (err) {
            return function (closeErr) {
                if(err || closeErr) {
                    console.log(err ? err : '', fileName, closeErr ? ' (error on closing)' : '');
                }
            };
        }
        fs.close(fileDescriptor, logFileErr(msg));
        callback(exifDate);
        return;
    }
}

/* builds a file->date map object which maps filenames
from fileArray located in dir to their EXIF DateCreated dates
and calls callback with that object
*/
function fileDateMap (dir, fileArray, callback) {
    if(!callback) throw 'Empty callback';
    var result = {};
    Object.defineProperty(result, 'baseDir', {value: dir, enumerable: false});
    if(fileArray.length === 0) return callback(result);
    result.filesPending = fileArray.length;
    fileArray.forEach(gatherDates);
  
    function gatherDates (fileName) {
        var filePath = result.baseDir + '/' + fileName;
        getExifDate(filePath, collectDate.bind(undefined, fileName));
    }

    function collectDate (fileName, date) {
        result[fileName] = date;
        if (--result.filesPending === 0) {
            delete result.filesPending;
            return callback(result);
        }
    }
}

/* Composes a new file name from the old one, a date object and options object.
Uses makeNewName to parse dates and apply options, passes it compose function
which actually composes a new filename.
Options with defaults:
dateSeparator: '.'  - separator of date parts
timeSeparator: '.'  - separator of time parts
dateTimeSeparator: '_'  - separates date from time
includeTitle: true - whether the new file name should include the title extracted from the old one
*/
function makeNewFileName (oldFileName, fileDate, options) {
    if(fileDate === null) return null;

    function compose (src) {
        if(options.hasOwnProperty('includeTitle') && ! options.includeTitle) {
            let fileExt = src.title.match(/\.[^.]+?$/g);
            src.title = fileExt ? fileExt[0] : '';
        }
        return [
            src.y, src.ds, src.m, src.ds, src.d,
            src.dts,
            src.h, src.ts, src.M, src.ts, src.s,
            src.title
        ].join('');
    }

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
d2 - day of the last contained file,
title - a title extracted from the original file name.
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
    
    function getTitle (fileName) {
        // if the title starts with a letter or number, direct appending to the date would be unpleasant
        // (this method is Unicode-safe)
        var title = extractTitle(fileName);
        if(title && (title[0].toLowerCase() !== title[0].toUpperCase() || /\d/.test(title[0]))) {
            title = ' ' + title;
        }
        return title;
    }
    src.title = getTitle(oldName);

    return composeFunc(src);
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

    The ultimate online tool for analysing that terrible thing below: https://regex101.com/
    The regex consists of 4 alternative subpatterns: 1st for dates in filenames,
    2nd for DCF filenames, 3rd for DCF directory names, and 4th for dates and date ranges in dirnames
    */
    var baseNamePattern = /\s?\d{4}\D?\d\d\D?\d\d((\D?\d\d){2,3})?|^\w{4}\d+|^\d{3}\w{5}|\d{4}\W?\d\d\W?\d\d(-(((\d{4}\W?)?\d\d\W?)?\d\d))?/g;
    return fileName.replace(baseNamePattern, '');
}

// Generates an object which maps filenames to their new names and calls callback with it.
// Takes a directory name, filename filter function and options object for makeNewFileName.
// The generated map includes a non-enumerable property baseDir indicating base directory of the files.
function fileRenameMap (dir, filterFunc, options, callback) {
    if(!callback) throw 'Empty callback';

    var fileList = listFiles(dir, filterFunc).filter(f => ! isDirectory(dir + '/' + f));
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
        var finalResult = alterConflicting(util.filterObject(result, fn => fn !== result[fn]));
        Object.defineProperty(finalResult, 'baseDir', {value: dir, enumerable: false});
        callback(finalResult);
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
            out = [dateListSorted[0], dateListSorted[dateListSorted.length - 1]];
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
includeTitle: true - whether new dir names should include titles extracted from old ones
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
            y2s = src.y2 + src.ds;
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
        if(options.hasOwnProperty('includeTitle') && ! options.includeTitle) {
            src.title = '';
        }
        return [
            src.y,
            src.ds,
            src.m,
            src.ds,
            src.d,
            rs,
            y2s,
            m2s,
            d2,
            src.title
        ].join('');
    };
    return makeNewName(oldName, dateRange, options, compose);
}

// Generates an object mapping current dir names to their new names and calls callback with it.
// Passes options object to makeNewDirName.
// The generated map includes a non-enumerable property baseDir indicating the base directory of operation.
function dirRenameMap (outerDir, options, callback) {
    var dirList = fs.readdirSync(outerDir).filter(fn => isDirectory(outerDir + '/' + fn));
    if(dirList.length === 0) return buildDirRenameMap({});
    var dirDateMap = {'pending': dirList.length};
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
        Object.keys(dirDateMap).forEach(dirName => {
            dirRenameMap[dirName] = makeNewDirName(dirName, dirDateMap[dirName], options);
        });
        var finalDirRenameMap = alterConflicting(util.filterObject(dirRenameMap, fn => fn !== dirRenameMap[fn]));
        Object.defineProperty(finalDirRenameMap, 'baseDir', {value: outerDir, enumerable: false});        
        callback(finalDirRenameMap);
    }
}

// Handles conflicting renames by adding (n) counter to the conflicting filenames
function alterConflicting (renameMap) {
    let targetSources = util.valueOccurences(renameMap);

    return util.mapObject(renameMap, entry => {
        let [src, dest] = entry;
        if(dest === null) return entry;
        let destOrd = targetSources[dest].indexOf(src);
        let ordInd = destOrd === 0 ? '' : ` #${destOrd + 1}`;
        let {name, ext} = path.parse(dest);
        let destResolved = name + ordInd + ext;
        return [src, destResolved];
    });
}

// Executes renaming of files or directories passed as a map object: {old: new, ...}
// contained in the base directory baseDir.
// Refuses to replace an existing file.
// Calls callback with an object mapping filenames to failure messages (if any).
function renameFiles (baseDir, renameMap, callback) {
    var failures = {};
    var pending = Object.keys(renameMap).length;
    function fullPath (fn) {
        return baseDir + '/' + fn;
    }
    Object.keys(renameMap).forEach(fn => renameIfExistsNot(fn));
    function renameIfExistsNot (fn) {
        fs.access(fullPath(renameMap[fn]), fs.constants.F_OK, err => {
            renameFile(err ? null : new Error('target exists'), fn, renameMap[fn]);
        });
    }
    function renameFile (err, oldName, newName) {
        if (err) {
            buildFailureList(err, oldName);
        }
        else {
            fs.rename(fullPath(oldName), fullPath(newName), err => buildFailureList(err, oldName));
        }
    }
    function buildFailureList(err, fn) {
        if (err) {
            failures[fn] = err.message;
            console.warn(err.message);
        }
        if (--pending === 0) {
            return callback(failures);
        }
    }
}

// TODO: what about *.thm files and associated objects, especially videos?
// Also, videos without *.thm files, having their dates only in fs attributes...

// TODO: suspicious cases (very old dates, subdirs containing both photos and another subdirs)
