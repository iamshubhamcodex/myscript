const { UnexpectedCharacterError } = require("./Error");

const StringEscapeMap = {
  t: "\t",
  n: "\n",
  b: "\b",
  "\\": "\\",
};

class Tokenizer {
  constructor(input, filename) {
    this.input = input;
    this.current = 0;
    this.row = 0;
    this.col = 0;
    this.filename = filename;
  }

  isEOF() {
    return this.current >= this.input.length;
  }

  peek(increment = 0) {
    return this.input[this.current + increment];
  }

  advance() {
    let curr = this.peek();
    this.current++;

    if (curr === "\n") {
      this.row++;
      this.col = 0;
    } else {
      this.col++;
    }
    return curr;
  }

  tokenize() {
    let tokens = [];
    while (!this.isEOF()) {
      let char = this.advance();

      if (char === "\n") {
        tokens.push({ type: "symbol", value: "\n" });
        continue;
      }

      if (char === ";") {
        tokens.push({ type: "symbol", value: ";" });
        continue;
      }

      if (/\s/.test(char)) {
        continue;
      }

      if (char === "/" && this.peek() === "-") {
        this.advance(); // consume '-'
        this.tokenizeBlockComment();
        continue;
      }

      if (char === "/" && this.peek() === "/") {
        this.advance(); // consume second '/'
        this.tokenizeLineComment();
        continue;
      }

      if (
        char === "=" ||
        char === "+" ||
        char === "-" ||
        char === "*" ||
        char === "/" ||
        char === "(" ||
        char === ")" ||
        char === "{" ||
        char === "}" ||
        char === "<" ||
        char === ">" ||
        char === "!" ||
        char === "|" ||
        char === "&" ||
        char === ":"
      ) {
        if (["<", ">", "=", "!"].includes(char) && this.peek() === "=") {
          tokens.push({ type: "symbol", value: char + this.advance() });
          continue;
        }
        if (["&", "|"].includes(char) && this.peek() === char) {
          tokens.push({ type: "symbol", value: char + this.advance() });
          continue;
        }
        tokens.push({ type: "symbol", value: char });
        continue;
      }

      if (char === '"' || char === "'") {
        tokens.push(this.tokenizeString(char));
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let identifier = char;
        while (!this.isEOF() && /[a-zA-Z0-9_]/.test(this.peek())) {
          identifier += this.advance();
        }
        if (["if", "else", "switch", "func"].includes(identifier)) {
          tokens.push({ type: "keyword", value: identifier });
        } else {
          tokens.push({ type: "identifier", value: identifier });
        }
        continue;
      }

      if (/[0-9]/.test(char)) {
        let number = char;
        while (!this.isEOF() && /[0-9.]/.test(this.peek())) {
          number += this.advance();
        }
        if (number.split(".").length > 2) {
          throw new UnexpectedCharacterError(
            `Invalid number format '${number}'`,
            this.row,
            this.col,
            this.input,
            this.filename
          );
        }
        tokens.push({ type: "number", value: number });
        continue;
      }

      throw new UnexpectedCharacterError(
        `Unexpected character '${char}'`,
        this.row,
        this.col,
        this.input,
        this.filename
      );
    }
    return tokens;
  }

  tokenizeString(delimiter) {
    let charArray = [];
    while (!this.isEOF()) {
      let char = this.advance();
      if (char === delimiter) {
        if (charArray.length === 1) {
          return { type: "character", value: charArray[0] };
        }
        return { type: "string", value: charArray.join("") };
      }
      if (char === "\\") {
        let nextChar = this.advance();
        if (nextChar in StringEscapeMap) {
          charArray.push(StringEscapeMap[nextChar]);
        } else {
          throw new UnexpectedCharacterError(
            `Invalid escape sequence: \\${nextChar}`,
            this.row,
            this.col,
            this.input,
            this.filename
          );
        }
      } else {
        charArray.push(char);
      }
    }
    throw new UnexpectedCharacterError(
      "Unterminated string",
      this.row,
      this.col,
      this.input,
      this.filename
    );
  }

  tokenizeBlockComment() {
    while (!this.isEOF()) {
      let char = this.advance();
      if (char === "-" && this.peek() === "/") {
        this.advance(); // consume '/'
        return;
      }
    }
    throw new UnexpectedCharacterError(
      "Unterminated comment",
      this.row,
      this.col,
      this.input,
      this.filename
    );
  }

  tokenizeLineComment() {
    while (!this.isEOF() && this.peek() !== "\n") {
      this.advance();
    }
  }
}

module.exports = Tokenizer;
