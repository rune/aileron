const {
  processUrlFormat,
  processUrl,
  runController,
  validateRoute
} = require("../lib/index")

const routerGenerator = ({ errHandler, badInputHandler, aileronStrict }) => {
  return (urlFormat, controller, strict = false) => {
    const { parsedUrlFormat, urlDataKeys } = processUrlFormat(urlFormat)
    validateRoute(urlFormat, urlDataKeys, controller, aileronStrict)
    let routerMiddleware = (req, res, next) => {
      let match = true
      let data = {}
      const cleanUrlArray = processUrl(req.url)

      if (strict && cleanUrlArray.length != parsedUrlFormat.length) {
        // Check for an exact match in strict mode
        next()
        return
      } else if (cleanUrlArray.length != parsedUrlFormat.length) {
        // Check for an almost exact match otherwise (missing id allowed)
        if (
          !(
            parsedUrlFormat[parsedUrlFormat.length - 1].type == "id" &&
            cleanUrlArray.length == parsedUrlFormat.length - 1
          )
        ) {
          next()
          return
        }
      }

      let index = 0
      for (let item of cleanUrlArray) {
        if (item == "") {
          /* Do nothing */
        } else if (!parsedUrlFormat[index]) {
          match = false
          next()
          return
        } else if (
          parsedUrlFormat[index].type == "resource" &&
          item != parsedUrlFormat[index].name
        ) {
          match = false
          next()
          return
        } else if (parsedUrlFormat[index].type == "id") {
          data[parsedUrlFormat[index].name] = item
        }
        index += 1
      }

      if (match) {
        runController(controller, { errHandler, badInputHandler }, req, res, next, data)
      } else {
        next()
      }
    }

    return routerMiddleware
  }
}

module.exports = routerGenerator
