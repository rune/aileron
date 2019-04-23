const { typeCheck } = require("type-check")

const runMiddleware = async (middleware, errHandler, req, res, next, data) => {
  try {
    // Conditionally await to allow for both sync & async functions.
    // The await is needed for errors thrown inside an async handler() to be caught.
    if (typeCheck("AsyncFunction", middleware)) {
      await middleware(req, res, next, data)
    } else {
      middleware(req, res, next, data)
    }
  } catch (err) {
    errHandler(req, res, err)
  }
}

module.exports = runMiddleware
