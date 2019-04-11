const { middlewareGenerator, routerGenerator } = require("./api/index")

module.exports = ({ badInputHandler, serverErrorHandler, strict } = {}) => {
  if (strict) {
    if (!badInputHandler || !serverErrorHandler) {
      throw "badInputHandler and serverErrorHandler must be specified in strict mode"
    }
  } else {
    strict = false
    // Reduce to single function with error code
    badInputHandler = (req, res, inputError, errMsg) => {
      res.writeHead(400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ err: inputError, message: errMsg }))
    }
    serverErrorHandler = (req, res, err, errorMsg) => {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ err: err, message: errorMsg }))
    }
  }
  return {
    router: routerGenerator({
      badInputHandler,
      serverErrorHandler,
      aileronStrict: strict
    }),
    middleware: middlewareGenerator()
  }
}
