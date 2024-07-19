const { VariableNameStartWithNumberError } = require("./Error");

class Parser {
  constructor(tokens, input, filename) {
    this.input = input;
    this.filename = filename;
    this.tokens = tokens;
    this.current = 0;
    this.col = 0;
    this.row = 0;
  }

  isEOF() {
    return this.current >= this.tokens.length;
  }

  peek() {
    return this.tokens[this.current];
  }

  advance() {
    this.col += this.tokens[this.current + 1]?.value?.length;
    return this.tokens[this.current++];
  }

  parse() {
    let ast = [];
    while (!this.isEOF()) {
      ast.push(this.parseStatement());
      if (
        !this.isEOF() &&
        this.peek().type === "symbol" &&
        this.peek().value === ";"
      ) {
        ast.push({ type: "LineTerminator", name: "semicolon", value: ";" });
        this.advance();
        this.row++;
        this.col = 0;
      }
    }
    return ast;
  }

  parseStatement() {
    const token = this.peek();
    if (token.type === "identifier" && token.value === "vari") {
      return this.parseVariableDeclaration();
    } else if (token.type === "identifier") {
      return this.parseAssignmentOrExpression();
    } else {
      return this.parseExpression();
    }
  }

  parseVariableDeclaration() {
    this.advance(); // consume 'vari'
    const nameToken = this.advance();
    if (nameToken.type === "number") {
      throw new VariableNameStartWithNumberError(
        "Variable names can not start with numbers",
        this.row,
        this.col + 1,
        this.input,
        this.filename
      );
    }
    let haveValue = this.peek().type === "symbol" && this.peek().value === "=";
    this.advance(); // consume '='
    const valueExpression = haveValue ? this.parseExpression() : undefined;

    return {
      type: "VariableDeclaration",
      name: nameToken.value,
      value: valueExpression,
    };
  }

  parseAssignmentOrExpression() {
    const nameToken = this.advance();
    if (
      !this.isEOF() &&
      this.peek().type === "symbol" &&
      this.peek().value === "="
    ) {
      this.advance(); // consume '='
      const valueExpression = this.parseExpression();
      return {
        type: "AssignmentExpression",
        name: nameToken.value,
        value: valueExpression,
      };
    } else {
      this.current--; // backtrack
      return this.parseExpression();
    }
  }

  parseExpression() {
    if (this.peek().type === "string" || this.peek().type === "character") {
      return { type: "StringLiteral", value: this.advance().value };
    }
    if (this.peek().type === "identifier") {
      switch (this.peek().value) {
        case "true":
        case "false":
          return { type: "BooleanLiteral", value: this.advance().value };
        case "undefined":
          return { type: "UndefinedLiteral", value: this.advance().value };
        case "null":
          return { type: "NullLiteral", value: this.advance().value };
      }
    }
    return this.parseAddition();
  }

  parseAddition() {
    let node = this.parseMultiplication();

    while (
      !this.isEOF() &&
      this.peek().type === "symbol" &&
      (this.peek().value === "+" || this.peek().value === "-")
    ) {
      let operator = this.advance().value;
      let right = this.parseMultiplication();
      node = {
        type: "BinaryExpression",
        operator: operator,
        left: node,
        right: right,
      };
    }

    return node;
  }

  parseMultiplication() {
    let node = this.parsePrimary();

    while (
      !this.isEOF() &&
      this.peek().type === "symbol" &&
      (this.peek().value === "*" || this.peek().value === "/")
    ) {
      let operator = this.advance().value;
      let right = this.parsePrimary();
      node = {
        type: "BinaryExpression",
        operator: operator,
        left: node,
        right: right,
      };
    }

    return node;
  }

  parsePrimary() {
    const token = this.advance();

    if (token.type === "number") {
      return { type: "NumericLiteral", value: parseFloat(token.value) };
    } else if (token.type === "identifier") {
      return { type: "Identifier", name: token.value };
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}

module.exports = Parser;
