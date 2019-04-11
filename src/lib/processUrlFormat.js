const removeTrailingSlash = require("./removeTrailingSlash")

const processUrlFormat = urlFormat => {
  let parsedUrlFormat = []
  let urlDataKeys = []

  const urlFormatArray = removeTrailingSlash(urlFormat.split("/"))

  let index = 0
  for (let item of urlFormatArray) {
    if (item.substring(0, 1) == ":") {
      parsedUrlFormat[index] = {
        type: "id",
        name: item.substring(1)
      }
      urlDataKeys.push(item.substring(1))
    } else if (item == "") {
      parsedUrlFormat[index] = {
        type: "blank",
        name: item
      }
    } else {
      parsedUrlFormat[index] = {
        type: "resource",
        name: item
      }
    }
    index += 1
  }

  return { parsedUrlFormat, urlDataKeys }
}

module.exports = processUrlFormat
