const { middlewareGenerator, routerGenerator } = require("./api/index")
const { validateTypes } = require("./lib/index")

module.exports = ({ errHandler, badInputHandler, successHandler, strict } = {}) => {
  if (strict) {
    const typeDefinitions = {
      errHandler: "Function | AsyncFunction",
      badInputHandler: "Function | AsyncFunction",
      successHandler: "Function | AsyncFunction"
    }
    const { inputErr } = validateTypes(typeDefinitions, {
      errHandler,
      badInputHandler,
      successHandler
    })
    if (inputErr) {
      throw `Aileron config error [strict mode]: ${inputErr.msg}`
    }
  } else {
    strict = false
    // Reduce to single function with error code
    badInputHandler = (req, res, err, errMsg) => {
      res.writeHead(409, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ err, message: errMsg }))
    }
    errHandler = (req, res, err, errMsg) => {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ err, message: errMsg }))
    }
    successHandler = (req, res, payload) => {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify(payload))
    }
  }
  return {
    router: routerGenerator({
      errHandler,
      badInputHandler,
      successHandler,
      aileronStrict: strict
    }),
    middleware: middlewareGenerator({ errHandler, successHandler })
  }
}
