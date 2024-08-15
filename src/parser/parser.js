// src/parser/parser.js

const TokenType = require("../lexer/tokenTypes");
const ASTNodeType = require("./astNodes");

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  peek() {
    return this.tokens[this.current];
  }

  peekNext() {
    return this.tokens[this.current + 1];
  }

  advance() {
    this.current++;
  }

  match(...expectedTypes) {
    const currentToken = this.peek();

    if (expectedTypes.includes(currentToken.type)) {
      this.advance();
      return currentToken;
    }
    throw new Error(`Unexpected token: ${currentToken.type}, Expected ${expectedTypes}`);
  }

  parse() {
    const programNode = {
      type: ASTNodeType.PROGRAM,
      body: [],
    };

    while (this.peek().type !== TokenType.EOF) {
      if (this.isDeclaration()) {
        programNode.body.push(this.parseDeclaration());
      } else {
        programNode.body.push(this.parseStatement());
      }
    }

    return programNode;
  }

  isDeclaration() {
    const token = this.peek();
    // Consider anything that starts with a type keyword or function return type as a declaration
    return (
      token.type === TokenType.KEYWORD &&
      ["int", "float", "char", "String"].includes(token.value)
    );
  }

  parseDeclaration() {
    if (this.peek().type === TokenType.KEYWORD) {
      switch (this.peek().value) {
        case "int":
        case "float":
        case "char":
        case "String":
          // Decide whether it's a variable or function declaration
          const nextToken = this.tokens[this.current + 2]; // after type and identifier
          if (nextToken && nextToken.type === TokenType.LPAREN) {
            return this.parseFunctionDeclaration();
          } else {
            return this.parseVariableDeclaration();
          }
        default:
          throw new Error(`Unexpected keyword: ${this.peek().value}`);
      }
    }

    throw new Error(`Unexpected token: ${this.peek().type}`);
  }

  parseStatement() {
    const token = this.peek();

    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        case "if":
          return this.parseIfStatement();
        case "switch":
          return this.parseSwitchStatement();
        case "while":
          return this.parseWhileStatement();
        case "do":
          return this.parseDoWhileStatement();
        case "for":
          return this.parseForStatement();
        case "return":
          return this.parseReturnStatement();
        case "break":
          return this.parseBreakStatement();
        case "continue":
          return this.parseContinueStatement();
        default:
          throw new Error(`Unexpected keyword: ${this.peek().value}`);
      }
    } else if (token.type === TokenType.IDENTIFIER) {
      // Peek ahead to see if this is a function call
      const nextToken = this.peekNext();
      if (nextToken.type === TokenType.LPAREN) {
        this.advance(); // Consume the function name (identifier)
        const functionCall = this.parseFunctionCall(token.value);
        this.match(TokenType.SEMICOLON); // Ensure there's a semicolon at the end of the function call statement
        return {
          type: ASTNodeType.EXPRESSION_STATEMENT,
          expression: functionCall,
        };
      } else {
        return this.parseExpressionStatement();
      }
    }

    throw new Error(`Unexpected token: ${this.peek().type}`);
  }

  // Function to parse an expression that is a standalone statement
  parseExpressionStatement() {
    const expression = this.parseExpression();
    this.match(TokenType.SEMICOLON); // Expect a semicolon at the end
    return {
      type: ASTNodeType.EXPRESSION_STATEMENT,
      expression: expression,
    };
  }

  parseVariableDeclaration() {
    const typeToken = this.match(TokenType.KEYWORD);
    const identifierToken = this.match(TokenType.IDENTIFIER);
    this.match(TokenType.ASSIGN);
    const valueNode = this.parseExpression();
    this.match(TokenType.SEMICOLON);

    return {
      type: ASTNodeType.VARIABLE_DECLARATION,
      varType: typeToken.value,
      id: identifierToken.value,
      value: valueNode,
    };
  }

  parseFunctionDeclaration() {
    const returnTypeToken = this.match(TokenType.KEYWORD); // Match the return type
    const identifierToken = this.match(TokenType.IDENTIFIER); // Match the function name
    this.match(TokenType.LPAREN); // Match '('

    // Parse parameters
    const params = this.parseParameters();

    this.match(TokenType.RPAREN); // Match ')'
    this.match(TokenType.LBRACE); // Match '{'

    // Parse the function body
    const body = this.parseBlock();

    this.match(TokenType.RBRACE); // Match '}'

    return {
      type: ASTNodeType.FUNCTION_DECLARATION,
      returnType: returnTypeToken.value,
      id: identifierToken.value,
      params: params,
      body: body,
    };
  }

  parseParameters() {
    const params = [];
    while (this.peek().type !== TokenType.RPAREN) {
      const paramTypeToken = this.match(TokenType.KEYWORD);
      const paramIdToken = this.match(TokenType.IDENTIFIER);
      params.push({
        type: paramTypeToken.value,
        id: paramIdToken.value,
      });

      if (this.peek().type === TokenType.COMMA) {
        this.advance(); // Skip the comma
      } else {
        break; // No more parameters
      }
    }
    return params;
  }

  parseIfStatement() {
    this.match(TokenType.KEYWORD); // Match 'if'
    this.match(TokenType.LPAREN); // Match '('
    const condition = this.parseExpression(); // Parse condition
    this.match(TokenType.RPAREN); // Match ')'
    const thenBranch = this.parseBlock(); // Parse 'then' block

    let elseBranch = null;
    if (
      this.peek().type === TokenType.KEYWORD &&
      this.peek().value === "else"
    ) {
      this.advance(); // Match 'else'
      if (
        this.peek().type === TokenType.KEYWORD &&
        this.peek().value === "if"
      ) {
        elseBranch = this.parseIfStatement(); // Handle 'else if'
      } else {
        elseBranch = this.parseBlock(); // Handle 'else'
      }
    }

    return {
      type: ASTNodeType.IF_STATEMENT,
      condition: condition,
      thenBranch: thenBranch,
      elseBranch: elseBranch,
    };
  }

  parseSwitchStatement() {
    this.match(TokenType.KEYWORD); // Match 'switch'
    this.match(TokenType.LPAREN); // Match '('
    const discriminant = this.parseExpression(); // Parse discriminant
    this.match(TokenType.RPAREN); // Match ')'
    this.match(TokenType.LBRACE); // Match '{'

    const cases = [];
    let defaultCase = null;

    while (this.peek().type !== TokenType.RBRACE) {
      if (
        this.peek().type === TokenType.KEYWORD &&
        this.peek().value === "case"
      ) {
        this.advance(); // Match 'case'
        const test = this.parseExpression(); // Parse case expression
        this.match(TokenType.COLON); // Match ':'
        const consequent = this.parseBlock(); // Parse block for this case // TODO: how can parse block handle parsing inside cases like break 
        cases.push({
          type: ASTNodeType.CASE_CLAUSE,
          test: test,
          consequent: consequent,
        });
      } else if (
        this.peek().type === TokenType.KEYWORD &&
        this.peek().value === "default"
      ) {
        this.advance(); // Match 'default'
        this.match(TokenType.COLON); // Match ':'
        defaultCase = this.parseBlock(); // Parse block for default
      } else {
        throw new Error(
          `Unexpected token in switch statement: ${this.peek().type}`
        );
      }
    }

    this.match(TokenType.RBRACE); // Match '}'

    return {
      type: ASTNodeType.SWITCH_STATEMENT,
      discriminant: discriminant,
      cases: cases,
      defaultCase: defaultCase,
    };
  }

  parseWhileStatement() {
    this.match(TokenType.KEYWORD); // Match 'while'
    this.match(TokenType.LPAREN); // Match '('
    const condition = this.parseExpression(); // Parse condition
    this.match(TokenType.RPAREN); // Match ')'
    const body = this.parseBlock(); // Parse loop body

    return {
      type: ASTNodeType.WHILE_STATEMENT,
      condition: condition,
      body: body,
    };
  }

  parseDoWhileStatement() {
    this.match(TokenType.KEYWORD); // Match 'do'
    const body = this.parseBlock(); // Parse loop body
    this.match(TokenType.KEYWORD); // Match 'while'
    this.match(TokenType.LPAREN); // Match '('
    const condition = this.parseExpression(); // Parse condition
    this.match(TokenType.RPAREN); // Match ')'
    this.match(TokenType.SEMICOLON); // Match ';'

    return {
      type: ASTNodeType.DO_WHILE_STATEMENT,
      condition: condition,
      body: body,
    };
  }

  parseForStatement() {
    this.match(TokenType.KEYWORD); // Match 'for'
    this.match(TokenType.LPAREN); // Match '('

    // Parse initialization, condition, and increment parts
    const init =
      this.peek().type !== TokenType.SEMICOLON
        ? this.parseVariableDeclaration()
        : null; // TODO: check this init is variable declaration not expression type
    // console.log(this.peek(), this.peekNext());
    // this.match(TokenType.SEMICOLON); // Match ';'
    const condition =
      this.peek().type !== TokenType.SEMICOLON ? this.parseExpression() : null;
    this.match(TokenType.SEMICOLON); // Match ';'
    const increment =
      this.peek().type !== TokenType.RPAREN ? this.parseExpression() : null;

    this.match(TokenType.RPAREN); // Match ')'
    const body = this.parseBlock(); // Parse loop body

    return {
      type: ASTNodeType.FOR_STATEMENT,
      init: init,
      condition: condition,
      increment: increment,
      body: body,
    };
  }

  parseBlock() {
    this.match(TokenType.LBRACE); // Match '{'
    const statements = [];
    while (this.peek().type !== TokenType.RBRACE) {
      if (this.isDeclaration()) {
        statements.push(this.parseDeclaration());
      } else {
        statements.push(this.parseStatement());
      }
    }
    this.match(TokenType.RBRACE); // Match '}'
    return {
      type: ASTNodeType.BLOCK,
      body: statements,
    };
  }

  parseReturnStatement() {
    this.match(TokenType.KEYWORD); // Match 'return'
    const expression = this.parseExpression(); // Parse the return expression
    this.match(TokenType.SEMICOLON); // Match the ending semicolon

    return {
      type: ASTNodeType.RETURN_STATEMENT,
      expression: expression,
    };
  }

  parseExpression() {
    return this.parseAssignmentExpression();
  }

  // Handle assignment expressions like `a = 10` or `a += 1`
  parseAssignmentExpression() {
    let leftNode = this.parseComparisonExpression(); // or parseBinaryExpression, if applicable

    if (this.peek().type === TokenType.ASSIGN) {
      const operatorToken = this.match(TokenType.ASSIGN);
      const rightNode = this.parseAssignmentExpression();
      leftNode = {
        type: ASTNodeType.ASSIGNMENT,
        operator: operatorToken.value,
        left: leftNode,
        right: rightNode,
      };
    }

    return leftNode;
  }

  // Handle comparison expressions like `a > b`, `a == b`
  parseComparisonExpression() {
    let leftNode = this.parseBinaryExpression();

    while (
      this.peek().type === TokenType.GREATER_THAN ||
      this.peek().type === TokenType.GREATER_EQUAL ||
      this.peek().type === TokenType.LESS_THAN ||
      this.peek().type === TokenType.LESS_EQUAL ||
      this.peek().type === TokenType.EQUAL_EQUAL ||
      this.peek().type === TokenType.NOT_EQUAL
    ) {
      const operatorToken = this.match(
        TokenType.GREATER_THAN,
        TokenType.GREATER_EQUAL,
        TokenType.LESS_THAN,
        TokenType.LESS_EQUAL,
        TokenType.EQUAL_EQUAL,
        TokenType.NOT_EQUAL
      );
      const rightNode = this.parseBinaryExpression();
      leftNode = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator: operatorToken.value,
        left: leftNode,
        right: rightNode,
      };
    }

    return leftNode;
  }

  // Handle arithmetic expressions like `a + b`, `a * b`
  parseBinaryExpression() {
    let leftNode = this.parsePrimaryExpression();

    while (
      this.peek().type === TokenType.PLUS ||
      this.peek().type === TokenType.MINUS ||
      this.peek().type === TokenType.MULTIPLY ||
      this.peek().type === TokenType.DIVIDE
    ) {
      const operatorToken = this.match(
        TokenType.PLUS,
        TokenType.MINUS,
        TokenType.MULTIPLY,
        TokenType.DIVIDE
      );
      const rightNode = this.parsePrimaryExpression();
      leftNode = {
        type: ASTNodeType.BINARY_EXPRESSION,
        operator: operatorToken.value,
        left: leftNode,
        right: rightNode,
      };
    }

    return leftNode;
  }

  // Handle primary expressions (literals, identifiers, and parenthesized expressions)

  parsePrimaryExpression() {
    const token = this.peek();

    if (
      token.type === TokenType.INT ||
      token.type === TokenType.FLOAT ||
      token.type === TokenType.CHAR ||
      token.type === TokenType.STRING
    ) {
      this.advance();
      return {
        type: ASTNodeType.LITERAL,
        value: token.value,
      };
    }

    if (token.type === TokenType.IDENTIFIER) {
      this.advance();

      // Check if this is a function call
      if (this.peek().type === TokenType.LPAREN) {
        return this.parseFunctionCall(token.value); // Pass the function name
      }

      return {
        type: ASTNodeType.IDENTIFIER,
        value: token.value,
      };
    }

    if (token.type === TokenType.LPAREN) {
      this.advance(); // Skip '('
      const exprNode = this.parseExpression();
      this.match(TokenType.RPAREN); // Match ')'
      return exprNode;
    }

    throw new Error(`Unexpected token in expression: ${token.type}`);
  }

  parseFunctionCall(functionName) {
    this.match(TokenType.LPAREN); // Match '('

    const args = [];
    if (this.peek().type !== TokenType.RPAREN) {
      // If not immediately closing the parenthesis
      do {
        args.push(this.parseExpression()); // Parse each argument
      } while (this.peek().type === TokenType.COMMA && this.advance()); // Continue if there's a comma
    }

    if (this.peek().type !== TokenType.RPAREN)
      args.push(this.parseExpression());
    this.match(TokenType.RPAREN); // Match ')'

    return {
      type: ASTNodeType.FUNCTION_CALL,
      id: functionName,
      arguments: args,
    };
  }
}

module.exports = Parser;
