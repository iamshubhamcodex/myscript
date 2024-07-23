const { VariableNameStartWithNumberError } = require("./Error");

class Parser {
  constructor(tokens, input, filename) {
    this.input = input;
    this.filename = filename;
    this.tokens = tokens;
    this.current = 0;
    this.col = 0;
    this.row = 0;
    this.ast = [];
  }

  isEOF() {
    return this.current >= this.tokens.length;
  }

  peek(increment = 0) {
    return this.tokens[this.current + increment];
  }

  advance() {
    let curr = this.peek(0);
    let next = this.peek(1);
    this.col += next?.value?.length;

    if (next && next.value === "\n") {
      this.row++;
      this.col = 0;

      this.current += 2;
      return curr;
    }
    return this.tokens[this.current++];
  }

  parse() {
    while (!this.isEOF()) {
      this.ast.push(this.parseStatement());
    }
    return this.ast;
  }

  parseStatement() {
    const token = this.peek();
    if (token.type === "keyword") {
      switch (token.value) {
        case "if":
          return this.parseIfStatement();
        case "switch":
          return this.parseSwitchStatement();
        default:
          throw new UnknownExpressionError(
            `Unknown keyword: ${token.value}`,
            this.row,
            this.col,
            this.input,
            this.filename
          );
      }
    } else if (token.type === "identifier" && token.value === "vari") {
      return this.parseVariableDeclaration();
    } else if (token.type === "identifier") {
      return this.parseAssignmentOrExpression();
    } else {
      return this.parseExpression();
    }
  }

  parseIfStatement() {
    this.advance(); // consume 'if'
    this.advance(); // consume '('
    const condition = this.parseExpression();
    this.advance(); // consume ')'
    this.advance(); // consume '{'
    const consequent = this.parseBlock();
    let alternate = null;

    if (
      !this.isEOF() &&
      this.peek().type === "keyword" &&
      this.peek().value === "else"
    ) {
      this.advance(); // consume 'else'
      if (this.peek().value === "if") {
        alternate = this.parseIfStatement();
      } else {
        this.advance(); // consume '{'
        alternate = this.parseBlock();
      }
    }

    return {
      type: "IfStatement",
      condition: condition,
      consequent: consequent,
      alternate: alternate,
    };
  }

  parseSwitchStatement() {
    this.advance(); // consume 'switch'
    this.advance(); // consume '('
    const variable = this.parseExpression();
    this.advance(); // consume ')'
    this.advance(); // consume '{'

    let caseBody = [];

    while (
      !this.isEOF() &&
      !(this.peek().type === "symbol" && this.peek().value === "}")
    ) {
      let equalCase = [];
      let isDefault =
        this.peek().type === "identifier" && this.peek().value === "default";

      if (isDefault) {
        this.advance(); // consume 'default'
        this.advance(); // consume ':'

        equalCase.push("default");
      } else {
        this.advance(); // consume 'case'

        equalCase.push(this.parseExpression());
        this.advance(); // consume ':'

        while (
          !this.isEOF() &&
          this.peek().type === "identifier" &&
          this.peek().value === "case"
        ) {
          this.advance(); //consume 'case'
          equalCase.push(this.parseExpression());
          this.advance(); // consume ':'
        }
      }

      const body = [];
      while (
        !this.isEOF() &&
        !(isDefault
          ? this.peek().type === "symbol" && this.peek().value === "}"
          : this.peek().type === "identifier" && this.peek().value === "break")
      ) {
        body.push(this.parseStatement());
      }
      this.advance(); // consume 'break;'
      this.advance(); // consume ';'
      caseBody.push({ equivalent: equalCase, body });
    }
    this.advance(); // consume '}'

    this.current = this.tokens.length + 5;
    return { type: "SwitchStatment", var: variable, caseBody };
  }

  parseBlock() {
    const body = [];
    while (
      !this.isEOF() &&
      this.peek().type !== "symbol" &&
      this.peek().value !== "}"
    ) {
      body.push(this.parseStatement());
    }
    this.advance(); // consume '}'
    return body;
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

    this.peek().type === "symbol" &&
      this.peek().value === ";" &&
      this.advance(); //consume ';'

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

      this.peek().type === "symbol" &&
        this.peek().value === ";" &&
        this.advance(); //consume ';'

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
    return this.parseLogical();
  }

  parseLogical() {
    let node = this.parseComparison();

    while (
      !this.isEOF() &&
      this.peek().type === "symbol" &&
      ["&&", "||"].includes(this.peek().value)
    ) {
      let operator = this.advance().value;
      let right = this.parseComparison();
      node = {
        type: "LogicalExpression",
        operator: operator,
        left: node,
        right: right,
      };
    }

    return node;
  }

  parseComparison() {
    let node = this.parseAddition();

    while (
      !this.isEOF() &&
      this.peek().type === "symbol" &&
      ["<", "<=", ">", ">=", "==", "!="].includes(this.peek().value)
    ) {
      let operator = this.advance().value;
      let right = this.parseAddition();
      node = {
        type: "BinaryExpression",
        operator: operator,
        left: node,
        right: right,
      };
    }

    return node;
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
    } else if (token.type === "symbol" && token.value === "(") {
      let node = this.parseExpression();
      this.advance(); // consume ')'
      return node;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}

module.exports = Parser;
