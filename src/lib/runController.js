const validateTypes = require("./validateTypes")
const { typeCheck } = require("type-check")

const runHandler = async (
  controller,
  { successHandler, errHandler, badInputHandler },
  req,
  res,
  next,
  data,
  isRouter
) => {
  let chosenController
  if (isRouter) {
    // For routers, controllers must be defined at request method level
    const requestMethod = req.method.toLowerCase()

    if (!controller[requestMethod]) {
      // No controller definition for this request method
      next()
      return
    } else {
      chosenController = controller[requestMethod]
    }
  } else {
    // For middlewares, a single controller is defined
    chosenController = controller
  }

  const { handler, inputs, errMsg, inputCheck } = chosenController

  try {
    // If input type definitions are supplied, check them
    if (inputs) {
      const { parsedInputs, inputErr } = validateTypes(inputs, req.body)
      if (inputErr) {
        badInputHandler(req, res, inputErr, errMsg)
        return
      }
      // If a custom inputCheck is supplied, run the checks
      if (inputCheck) {
        try {
          inputCheck(parsedInputs)
        } catch (err) {
          badInputHandler(req, res, err, errMsg)
          return
        }
      }
      for (const key in parsedInputs) {
        data[key] = parsedInputs[key]
      }
    }

    // Conditionally await to allow for both sync & async functions.
    // The await is needed for errors thrown inside an async handler() to be caught.
    let payload
    if (typeCheck("AsyncFunction", handler)) {
      payload = await handler(req, data)
    } else {
      payload = handler(req, data)
    }

    if (isRouter) {
      // For routers, we run the successHandler with the payload
      successHandler(req, res, payload)
    } else {
      // For middleware, on success, we simply run next()
      next()
    }
  } catch (err) {
    errHandler(req, res, err, errMsg)
  }
}

module.exports = runHandler
