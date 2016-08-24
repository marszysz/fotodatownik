'use strict';
const fs = require ('fs');

function listFiles (dir) {
    return fs.readdirSync (dir);
}

function getExifDate (fileName, callback) {
    // reads `date taken` from fileName and passes it to callback
    // in the form of Date object, null if failed
    var fs = require('fs');
    fs.stat(fileName, function(error, stats) {
        // todo: make some idiot-proofing at opening file (file accesibility etc.)
        // the best method for an error seems to be null result and a notice to the console 
        fs.open(fileName, 'r', function(error, fileDescriptor) {
            var exifEnd = 65635; // the maximum position within the JPEG file where EXIF metadata block could reach
            var exifBuffer = Buffer.allocUnsafe(stats.size < exifEnd ? stats.size : exifEnd);
            fs.read(fileDescriptor, exifBuffer, 0, exifBuffer.length, 0, function(error, bytesRead, buffer) {
                fs.close(fileDescriptor, (error) => console.log('Done with a file: ', fileName));
                var parser = require('exif-parser').create(buffer);
                parser.enableImageSize(false);
                var result = parser.parse();
                callback(result.tags.DateTimeOriginal);
            });
        });
    });
}

// exports for the unit tests
exports.listFiles = listFiles;
exports.getExifDate = getExifDate;