const TokenType = {
  // Keywords
  KEYWORD: "KEYWORD",
  IDENTIFIER: "IDENTIFIER",

  // Data Types
  INT: "INT",
  FLOAT: "FLOAT",
  CHAR: "CHAR",
  STRING: "STRING",

  // Operators
  PLUS: "PLUS",
  MINUS: "MINUS",
  MULTIPLY: "MULTIPLY",
  DIVIDE: "DIVIDE",
  ASSIGN: "ASSIGN",
  GREATER_THAN: "GREATER_THAN", // >
  LESS_THAN: "LESS_THAN", // <
  GREATER_EQUAL: "GREATER_EQUAL", // >=
  LESS_EQUAL: "LESS_EQUAL", // <=
  EQUAL_EQUAL: "EQUAL_EQUAL", // ==
  NOT_EQUAL: "NOT_EQUAL", // !=

  // Punctuation
  LPAREN: "LPAREN", // (
  RPAREN: "RPAREN", // )
  LBRACE: "LBRACE", // {
  RBRACE: "RBRACE", // }
  SEMICOLON: "SEMICOLON",
  COMMA: "COMMA",
  COLON: "COLON",

  // Other
  EOF: "EOF", // End of file/input
};
module.exports = TokenType;
