const validateInputTypes = require("./validateInputTypes")

const runController = (
  controller,
  { badInputHandler, serverErrorHandler },
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

  const { handler, inputs, errorMsg } = controller[requestMethod]

  try {
    if (inputs) {
      const { receivedInputs, inputErrors } = validateInputTypes(inputs, req.body)
      if (inputErrors) {
        badInputHandler(req, res, inputErrors, errorMsg)
        return
      } else {
        for (const key in receivedInputs) {
          data[key] = receivedInputs[key]
        }
      }
    }
    handler(req, res, next, data)
  } catch (err) {
    serverErrorHandler(req, res, err, errorMsg)
  }
}

module.exports = runController
