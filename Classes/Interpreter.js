const {
  VariableNotDefinedError,
  VariableAlreadyExistsError,
  UnknownExpressionError,
} = require("./Error");

class Interpreter {
  constructor(ast, input, filename) {
    this.ast = ast;
    this.env = {};
    this.row = 1;
    this.col = 1;
    this.input = input;
    this.filename = filename;
  }

  findColumnIndex(name) {
    let currLine = this.input.split("\n")[this.row + 1];
    return currLine.indexOf("=") + currLine.split("=")[1].indexOf(name) + 2;
  }

  evaluate(node) {
    switch (node.type) {
      case "VariableDeclaration":
        if (node.name in this.env) {
          throw new VariableAlreadyExistsError(
            `Variable '${node.name}' is already defined`,
            this.row,
            5,
            this.input,
            this.filename
          );
        }
        this.env[node.name] = ![undefined, null].includes(node.value)
          ? this.evaluateExpression(node.value)
          : undefined;
        break;
      case "AssignmentExpression":
        if (!(node.name in this.env)) {
          throw new VariableNotDefinedError(
            `Variable ${node.name} is not defined`,
            this.row,
            this.findColumnIndex(node.name),
            this.input,
            this.filename
          );
        }
        this.env[node.name] = this.evaluateExpression(node.value);
        break;
      case "BinaryExpression":
      case "NumericLiteral":
      case "Identifier":
        return this.evaluateExpression(node);
      case "StringLiteral":
        return this.evaluateString(node.value);
    }
  }

  evaluateString(charArray) {
    let len = charArray.length;
    while (len-- > 0) {}
  }

  evaluateExpression(node) {
    switch (node.type) {
      case "BooleanLiteral":
        return node.value === "true";
      case "UndefinedLiteral":
        return undefined;
      case "NullLiteral":
        return null;
      case "StringLiteral":
        return node.value;
      case "NumericLiteral":
        return node.value;

      case "Identifier":
        if (!(node.name in this.env)) {
          throw new VariableNotDefinedError(
            `Variable '${node.name}' is not defined`,
            this.row + 1,
            this.findColumnIndex(node.name),
            this.input,
            this.filename
          );
        }
        return this.env[node.name];

      case "BinaryExpression":
        const left = this.evaluateExpression(node.left);
        const right = this.evaluateExpression(node.right);

        switch (node.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return left / right;
          default:
            throw new Error(`Unknown operator: ${node.operator}`);
        }

      default:
        throw new UnknownExpressionError(
          `Unknown expression type: ${node.type}`,
          this.row,
          this.findColumnIndex(node.value),
          this.input,
          this.filename
        );
    }
  }

  execute() {
    this.ast.forEach((node) => {
      if (node.type === "LineTerminator") {
        this.col = 0;
        this.row++;
      } else if (
        node.type === "VariableDeclaration" ||
        node.type === "AssignmentExpression"
      ) {
        this.evaluate(node);
      } else {
        console.log(this.evaluate(node));
      }
    });
  }
}

module.exports = Interpreter;
