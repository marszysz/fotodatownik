exports.getType = (function getType(global) {
  return function(obj) {
    if (obj === global) {
      return 'global';
    }
    return ({}).toString.call(obj).match(/\s([a-zA-Z0-9]+)/)[1].toLowerCase();
  };
})(this);

// filters an object similarly to Array.prototype.filter, passing each key to the filter function
exports.filterObject = function (srcObj, filterFunc) {
  return Object.keys(srcObj)
      .filter(filterFunc)
      .reduce((acc, cur) => {acc[cur] = srcObj[cur]; return acc}, {});
};

// maps an object similarly to Array.prototype.map,
// passing each [key, value] array to the filter function
exports.mapObject = function (srcObj, mapFunc) {
  return Object.keys(srcObj)
      .map(key => [key, srcObj[key]])
      .map(mapFunc)
      .reduce((acc, cur) => {acc[cur[0]] = cur[1]; return acc}, {});
};
