const removeTrailingSlash = urlArray => {
  if (urlArray[urlArray.length - 1] == "") {
    return urlArray.slice(0, -1)
  } else {
    return urlArray
  }
}

module.exports = removeTrailingSlash
