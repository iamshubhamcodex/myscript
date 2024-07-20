const fs = require("fs");
const Tokenizer = require("./Tokenizer");
const Parser = require("./Parser");
const Interpreter = require("./Interpreter");
const { CustomError } = require("./Error");

class Runner {
  constructor(filename, encoding, baseDir) {
    this.filename = baseDir + `\\${filename}`;
    this.encoding = encoding;
    this.input = "";
  }

  readFromFile() {
    try {
      const data = fs.readFileSync(this.filename, this.encoding);
      return data;
    } catch (error) {
      throw new Error(
        "Error reading from file " +
          this.filename.replaceAll(this.baseDir + "\\", "")
      );
    }
  }

  logger(...args) {
    console.log("PL >", ...args);
  }

  run() {
    try {
      this.input = this.readFromFile();
      this.execute();
    } catch (error) {
      this.handleError(error);
    }
  }

  execute() {
    const tokens = this.tokenize();
    const ast = this.parse(tokens);
    const interpreter = this.interpret(ast);

    Object.keys(interpreter.env).length !== 0 && this.logger(interpreter.env);
  }

  tokenize() {
    const tokenizer = new Tokenizer(this.input, this.filename);
    return tokenizer.tokenize();
  }

  parse(tokens) {
    const parser = new Parser(tokens, this.input, this.filename);
    return parser.parse();
  }

  interpret(ast) {
    const interpreter = new Interpreter(
      ast,
      this.input,
      this.filename,
      this.logger
    );
    interpreter.execute();

    return interpreter;
  }

  handleError(error) {
    this.logger(error.message);

    if (!(error instanceof CustomError)) {
      this.logger(error.stack);
    }
  }
}

module.exports = Runner;
