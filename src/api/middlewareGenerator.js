const {
  processUrlFormat,
  processUrl,
  runController,
  validateRoute
} = require("../lib/index")

// Middleware that can process wildcards
const middlewareGenerator = ({
  errHandler,
  badInputHandler,
  successHandler,
  aileronStrict
}) => {
  return (urlFormat, controller) => {
    const { parsedUrlFormat, urlDataKeys } = processUrlFormat(urlFormat)
    validateRoute(urlFormat, urlDataKeys, controller, aileronStrict, false)

    let routerMiddleware = async (req, res, next) => {
      let data = {}
      const cleanUrlArray = processUrl(req.url)

      if (cleanUrlArray.length < parsedUrlFormat.length) {
        // Url cannot be shorter than the url format, except for an optional id
        // The one corner case is that it is shorter by exactly 1 unit (the optional id)
        if (
          !(
            parsedUrlFormat[parsedUrlFormat.length - 1].type === "id" &&
            cleanUrlArray.length === parsedUrlFormat.length - 1
          )
        ) {
          next()
          return
        }
      }

      let index = 0
      for (let item of cleanUrlArray) {
        if (index > parsedUrlFormat.length - 1) {
          // Only check the part of the URL in the url format
          break
        }
        if (item == "") {
          /* Do nothing */
        } else if (
          parsedUrlFormat[index].type === "resource" &&
          item !== parsedUrlFormat[index].name
        ) {
          next()
          return
        } else if (parsedUrlFormat[index].type === "id") {
          data[parsedUrlFormat[index].name] = item
        }
        index += 1
      }

      runController(
        controller,
        { errHandler, badInputHandler, successHandler },
        req,
        res,
        next,
        data,
        false
      )
    }

    return routerMiddleware
  }
}

module.exports = middlewareGenerator
