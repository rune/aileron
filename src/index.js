const { middlewareGenerator, routerGenerator } = require("./api/index")
const { validateTypes } = require("./lib/index")

module.exports = ({ errHandler, badInputHandler, strict } = {}) => {
  if (strict) {
    const typeDefinitions = { errHandler: "Function", badInputHandler: "Function" }
    const { inputErr } = validateTypes(typeDefinitions, { errHandler, badInputHandler })
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
  }
  return {
    router: routerGenerator({
      errHandler,
      badInputHandler,
      aileronStrict: strict
    }),
    middleware: middlewareGenerator({ errHandler })
  }
}
