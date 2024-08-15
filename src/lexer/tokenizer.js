const TokenType = require("./tokenTypes");

class Tokenizer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
  }

  peek() {
    return this.input[this.position];
  }

  peekNext() {
    return this.input[this.position + 1];
  }
  advance() {
    this.position++;
  }

  tokenize() {
    while (this.position < this.input.length) {
      const currentChar = this.peek();

      if (this.isWhitespace(currentChar)) {
        this.advance();
      } else if (this.isDigit(currentChar)) {
        this.tokenizeNumber();
      } else if (this.isLetter(currentChar)) {
        this.tokenizeIdentifier();
      } else if (currentChar === "'") {
        this.tokenizeChar();
      } else if (currentChar === '"') {
        this.tokenizeString();
      } else {
        this.tokenizeSymbol(currentChar);
      }
    }
    this.tokens.push({ type: TokenType.EOF, value: null });
    return this.tokens;
  }

  isWhitespace(char) {
    return /\s/.test(char);
  }

  isDigit(char) {
    return /\d/.test(char);
  }

  isLetter(char) {
    return /[a-zA-Z]/.test(char);
  }

  tokenizeNumber() {
    let numStr = "";
    let isFloat = false;

    while (this.isDigit(this.peek()) || this.peek() === ".") {
      if (this.peek() === ".") {
        if (isFloat) {
          throw new Error(`Unexpected character: .`);
        }
        isFloat = true;
      }
      numStr += this.peek();
      this.advance();
    }

    if (isFloat) {
      this.tokens.push({ type: TokenType.FLOAT, value: parseFloat(numStr) });
    } else {
      this.tokens.push({ type: TokenType.INT, value: parseInt(numStr, 10) });
    }
  }

  tokenizeIdentifier() {
    let idStr = "";
    while (this.isLetter(this.peek())) {
      idStr += this.peek();
      this.advance();
    }

    // Keywords recognition
    const keywords = [
      "int",
      "float",
      "char",
      "String",
      "return",
      "if",
      "else",
      "switch",
      "case",
      "default",
      "for",
      "while",
      "do",
      "break",
      "continue",
    ];

    if (keywords.includes(idStr)) {
      this.tokens.push({ type: TokenType.KEYWORD, value: idStr });
    } else {
      this.tokens.push({ type: TokenType.IDENTIFIER, value: idStr });
    }
  }

  tokenizeChar() {
    this.advance(); // Skip opening quote
    const charValue = this.peek();
    this.advance();

    if (this.peek() !== "'") {
      throw new Error(
        `Unexpected character: expected ' after character literal`
      );
    }

    this.advance(); // Skip closing quote
    this.tokens.push({ type: TokenType.CHAR, value: charValue });
  }

  tokenizeString() {
    let strValue = "";
    this.advance(); // Skip opening quote

    while (this.peek() !== '"') {
      if (this.peek() === undefined) {
        throw new Error(`Unterminated string literal`);
      }
      strValue += this.peek();
      this.advance();
    }

    this.advance(); // Skip closing quote
    this.tokens.push({ type: TokenType.STRING, value: strValue });
  }

  // src/lexer/tokenizer.js

  tokenizeSymbol(currentChar) {
    switch (currentChar) {
      case "+":
        this.tokens.push({ type: TokenType.PLUS, value: currentChar });
        break;
      case "-":
        this.tokens.push({ type: TokenType.MINUS, value: currentChar });
        break;
      case "*":
        this.tokens.push({ type: TokenType.MULTIPLY, value: currentChar });
        break;
      case "/":
        this.tokens.push({ type: TokenType.DIVIDE, value: currentChar });
        break;
      case "=":
        if (this.peekNext() === "=") {
          this.advance(); // Move past the next '='
          this.tokens.push({ type: TokenType.EQUAL_EQUAL, value: "==" });
        } else {
          this.tokens.push({ type: TokenType.ASSIGN, value: currentChar });
        }
        break;
      case ">":
        if (this.peekNext() === "=") {
          this.advance();
          this.tokens.push({ type: TokenType.GREATER_EQUAL, value: ">=" });
        } else {
          this.tokens.push({
            type: TokenType.GREATER_THAN,
            value: currentChar,
          });
        }
        break;
      case "<":
        if (this.peekNext() === "=") {
          this.advance();
          this.tokens.push({ type: TokenType.LESS_EQUAL, value: "<=" });
        } else {
          this.tokens.push({ type: TokenType.LESS_THAN, value: currentChar });
        }
        break;
      case "!":
        if (this.peekNext() === "=") {
          this.advance();
          this.tokens.push({ type: TokenType.NOT_EQUAL, value: "!=" });
        } else {
          throw new Error(`Unexpected character: ${currentChar}`);
        }
        break;
      case "(":
        this.tokens.push({ type: TokenType.LPAREN, value: currentChar });
        break;
      case ")":
        this.tokens.push({ type: TokenType.RPAREN, value: currentChar });
        break;
      case "{":
        this.tokens.push({ type: TokenType.LBRACE, value: currentChar });
        break;
      case "}":
        this.tokens.push({ type: TokenType.RBRACE, value: currentChar });
        break;
      case ";":
        this.tokens.push({ type: TokenType.SEMICOLON, value: currentChar });
        break;
      case ",":
        this.tokens.push({ type: TokenType.COMMA, value: currentChar });
        break;
      case ":":
        this.tokens.push({ type: TokenType.COLON, value: currentChar });
        break;
      default:
        throw new Error(`Unexpected character: ${currentChar}`);
    }
    this.advance();
  }
}

module.exports = Tokenizer;
