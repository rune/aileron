const validateTypes = require("./validateTypes")

module.exports = (urlFormat, urlDataKeys, controller, aileronStrict) => {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    for (const method in controller) {
      const sub = controller[method]
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
