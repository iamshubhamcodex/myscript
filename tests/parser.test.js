// tests/parser.test.js

const Tokenizer = require("../src/lexer/tokenizer");
const Parser = require("../src/parser/parser");
const TypeChecker = require("../src/semantic/typeChecker");

function testParser() {
  const input = `

    int a = 10;
    int b = 20;
    
    if (a > b) {
        print("a is greater than b");
    } else {
        print("a is not greater than b");
    }

    while (a < b) {
        a = a + 1;
    }

    for (int i = 0; i < 10; i = i + 1) {
        print(i);
    }

    switch (a) {
        case 10:
            print("a is 10");
            break;
        case 20:
            print("a is 20");
            break;
        default:
            print("a is something else");
    }
    `;
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  // Perform type checking
  // const typeChecker = new TypeChecker();
  // typeChecker.check(ast);

  console.log(JSON.stringify(ast, null, 2));
}

testParser();
