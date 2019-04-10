const urlParser = require("url")
const removeTrailingSlash = require("./removeTrailingSlash")

const processUrl = url => {
  return removeTrailingSlash(urlParser.parse(url).pathname.split("/"))
}

module.exports = processUrl
