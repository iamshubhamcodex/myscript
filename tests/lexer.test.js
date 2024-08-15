const Tokenizer = require('../src/lexer/tokenizer');

function testTokenizer() {
    const input = `int result = add(3, 4);
    `;
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.tokenize();

    console.log(tokens);
}

testTokenizer();
