const validateTypes = require("./validateTypes")
const { typeCheck } = require("type-check")

const runController = async (
  controller,
  { errHandler, badInputHandler },
  req,
  res,
  next,
  data
) => {
  const requestMethod = req.method.toLowerCase()

  if (!controller[requestMethod]) {
    // No controller definition for this request method
    next()
    return
  }

  const { handler, inputs, errMsg } = controller[requestMethod]

  try {
    if (inputs) {
      const { parsedInputs, inputErr } = validateTypes(inputs, req.body)
      if (inputErr) {
        badInputHandler(req, res, inputErr, errMsg)
        return
      } else {
        for (const key in parsedInputs) {
          data[key] = parsedInputs[key]
        }
      }
    }
    // Conditionally await to allow for both sync & async functions.
    // The await is needed for errors thrown inside an async handler() to be caught.
    if (typeCheck("AsyncFunction", handler)) {
      await handler(req, res, next, data)
    } else {
      handler(req, res, next, data)
    }
  } catch (err) {
    errHandler(req, res, err, errMsg)
  }
}

module.exports = runController
