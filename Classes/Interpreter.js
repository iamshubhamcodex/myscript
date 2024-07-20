const {
  VariableNotDefinedError,
  VariableAlreadyExistsError,
  UnknownExpressionError,
  UnknownOperatorError,
} = require("./Error");

class Interpreter {
  constructor(ast, input, filename, logger) {
    this.ast = ast;
    this.env = {};
    this.row = 0;
    this.col = 0;
    this.input = input;
    this.filename = filename;
    this.logger = logger;
  }

  findColumnIndex(name, variableDeclaration) {
    let currLine = this.input.split("\n")[this.row];
    if (variableDeclaration)
      return currLine.indexOf("=") + currLine.split("=")[1].indexOf(name) + 2;
    return currLine.indexOf(name) + 1;
  }

  evaluate(node) {
    switch (node.type) {
      case "IfStatement":
        return this.evaluateIfStatement(node);
      case "SwitchStatement":
        return this.evaluateSwitchStatement(node);
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
          case ">":
            return left > right;
          case "<":
            return left < right;
          case "==":
            return left == right;
          case "!=":
            return left != right;
          case "&&":
            return left && right;
          case "||":
            return left || right;
          default:
            throw new UnknownOperatorError(
              `Unknown operator: ${node.operator}`,
              this.row,
              this.findColumnIndex(node.operator),
              this.input,
              this.filename
            );
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

  evaluateIfStatement(node) {
    if (this.evaluateExpression(node.condition)) {
      this.executeBlock(node.consequent);
    } else if (node.alternate) {
      if (node.alternate.type === "IfStatement") {
        this.evaluateIfStatement(node.alternate);
      } else {
        this.executeBlock(node.alternate);
      }
    }
  }

  evaluateSwitchStatement(node) {
    // Similar evaluation logic for switch
  }

  executeBlock(block) {
    for (let statement of block) {
      this.evaluate(statement);
    }
  }

  execute() {
    this.ast.forEach((node) => {
      if (node.type === "LineTerminator") {
        this.col = 0;
        this.row++;
      } else if (
        node.type === "VariableDeclaration" ||
        node.type === "AssignmentExpression" ||
        node.type === "IfStatement"
      ) {
        this.evaluate(node);
      } else {
        this.logger(this.evaluate(node));
      }
    });
  }
}

module.exports = Interpreter;
