class CustomError extends Error {
  constructor(name, message, line, column, input, filename) {
    super(message);
    this.errorMessage = message
    this.name = name;
    this.line = line;
    this.column = column;
    this.input = input;
    this.filename = filename;
    this.message = this.getMessage();
  }

  getMessage() {
    return (
      `${this.filename}\n${this.getErrorTextFromInput()}\n\n` +
      `${this.name}: ${this.errorMessage}
       at ${this.filename}:${this.line}:${this.column}\n`
    );
  }

  getErrorTextFromInput() {
    let inputArray = this.input.split("\n");

    let errorText = this.generateErrorText(inputArray, 5);

    return errorText;
  }
  generateErrorText(inputArray, stackNumber) {
    let text = "\t";
    let upperStack = parseInt(stackNumber / 2);
    let lowerStack = Math.floor(stackNumber / 2);

    while (upperStack >= 0) {
      if (this.line - upperStack >= 0)
        text += `${this.line - upperStack + 1}: |\t ${
          inputArray[this.line - upperStack]
        } \n\t`;
      upperStack--;
    }

    text += `\t${" ".repeat(this.column - 1)} ^`;

    for (let i = 1; i < lowerStack + 1; i++) {
      if (this.line + i < inputArray.length)
        text += `\n\t${this.line + i + 1}: |\t ${inputArray[this.line + i]}`;
    }

    return text;
  }
}
class UnexpectedCharacterError extends CustomError {
  constructor(message, line, column, input, filename) {
    super("UnexpectedCharacterError", message, line, column, input, filename);
  }
}
class VariableNameStartWithNumberError extends CustomError {
  constructor(message, line, column, input, filename) {
    super(
      "VariableNameStartWithNumberError",
      message,
      line,
      column,
      input,
      filename
    );
  }
}
class VariableNotDefinedError extends CustomError {
  constructor(message, line, column, input, filename) {
    super("VariableNotDefinedError", message, line, column, input, filename);
  }
}
class VariableAlreadyExistsError extends CustomError {
  constructor(message, line, column, input, filename) {
    super("VariableAlreadyExistsError", message, line, column, input, filename);
  }
}
class UnknownExpressionError extends CustomError {
  constructor(message, line, column, input, filename) {
    super("UnknownExpressionError", message, line, column, input, filename);
  }
}

module.exports = {
  CustomError,
  UnknownExpressionError,
  UnexpectedCharacterError,
  VariableNameStartWithNumberError,
  VariableNotDefinedError,
  VariableAlreadyExistsError,
};
