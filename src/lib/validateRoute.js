module.exports = (urlFormat, urlDataKeys, controller, aileronStrict) => {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    for (const method in controller) {
      const sub = controller[method]
      // url data keys cannot match input keys
      const inputKeys = sub.inputs || []
      const allKeys = urlDataKeys.concat(inputKeys)
      const distinctKeys = new Set(allKeys)
      if (allKeys.length !== distinctKeys.size) {
        throw `Incorrect controller configuration for ${urlFormat}.${method}.
          URL codes and request body inputs must all be unique`
      }
      // Handler must be supplied
      let controllerRequirements = ["handler"]
      // If strict mode is enabled, inputs and error messages must also be supplied
      if (aileronStrict) {
        controllerRequirements = ["inputs", "handler", "errorMsg"]
      }
      for (const key of controllerRequirements) {
        if (!sub[key]) {
          throw `Incorrect controller configuration for ${urlFormat}.${method}.
            "${key}" is not defined.`
        }
      }
    }
  }
}
