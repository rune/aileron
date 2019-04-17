const { typeCheck } = require("type-check")

const validateTypes = (typeDefinitions, receivedInputs = {}) => {
  try {
    let parsedInputs = {}
    for (const inputName in typeDefinitions) {
      // Automatically convert "?" to "| Undefined"
      const typeDefinition = typeDefinitions[inputName].replace("?", "| Undefined")
      if (typeCheck(typeDefinition, receivedInputs[inputName])) {
        parsedInputs[inputName] = receivedInputs[inputName]
      } else {
        return {
          inputErr: {
            err: { [inputName]: receivedInputs[inputName] },
            msg: `Aileron type error: "${inputName}" of type ${
              typeDefinitions[inputName]
            } should be provided. Received "${receivedInputs[inputName]}" instead.`
          }
        }
      }
    }
    return { parsedInputs }
  } catch (err) {
    throw { message: "Aileron type validation error", err: err }
  }
}

module.exports = validateTypes
