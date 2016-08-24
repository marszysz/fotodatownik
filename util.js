getType = (function getType(global) {
  return function(obj) {
    if (obj === global) {
      return 'global';
    }
    return ({}).toString.call(obj).match(/\s([a-zA-Z0-9]+)/)[1].toLowerCase();
  }
})(this);

exports.getType = getType;