const { typeCheck } = require("type-check")

const validateInputTypes = (inputDefinitions, receivedInputs) => {
  let parsedInputs = {}
  for (const inputName in inputDefinitions) {
    if (typeCheck(inputDefinitions[inputName], receivedInputs[inputName])) {
      parsedInputs[inputName] = receivedInputs[inputName]
    } else {
      return { inputErrors: { [inputName]: receivedInputs[inputName] } }
    }
  }
  return { parsedInputs }
}

module.exports = validateInputTypes
