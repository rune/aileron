const validateTypes = require("./validateTypes")

module.exports = (urlFormat, urlDataKeys, controller, aileronStrict, isRouter) => {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    let controllerObject
    if (isRouter) {
      controllerObject = controller
    } else {
      // We don't have separate middlewares for different request methods
      controllerObject = { middleware: controller }
    }
    for (const method in controllerObject) {
      const sub = controllerObject[method]
      // url data keys cannot match input keys
      const inputKeys = sub.inputs || []
      const allKeys = urlDataKeys.concat(inputKeys)
      const distinctKeys = new Set(allKeys)
      if (allKeys.length !== distinctKeys.size) {
        throw `Aileron controller config error: ${urlFormat}.${method}.
          URL wildcards and request body inputs must all be unique`
      }
      // Handler must be supplied
      let controllerDefinition = {
        handler: "Function | AsyncFunction",
        inputs: "Object | Undefined",
        errMsg: "String |  Undefined",
        inputCheck: "Function | Undefined"
      }
      // If strict mode is enabled, inputs and error messages must also be supplied
      if (aileronStrict) {
        controllerDefinition.inputs = "Object"
        controllerDefinition.errMsg = "String"
      }
      const { inputErr } = validateTypes(controllerDefinition, sub)
      if (inputErr) {
        throw `Aileron controller config error: ${urlFormat}.${method}. ${inputErr.msg}`
      }
    }
  }
}
