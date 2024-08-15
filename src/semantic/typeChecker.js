// src/semantic/typeChecker.js

const ASTNodeType = require("../parser/astNodes");
const TokenType = require("../lexer/tokenTypes");

class TypeChecker {
  constructor() {
    this.symbolTable = new Map(); // For variables
    this.functionTable = new Map(); // For functions
  }

  check(programNode) {
    for (const statement of programNode.body) {
      this.checkStatement(statement);
    }
  }

  checkStatement(statement) {
    switch (statement.type) {
      case ASTNodeType.VARIABLE_DECLARATION:
        this.checkVariableDeclaration(statement);
        break;
      case ASTNodeType.FUNCTION_DECLARATION:
        this.checkFunctionDeclaration(statement);
        break;
      case ASTNodeType.BINARY_EXPRESSION:
        this.checkBinaryExpression(statement);
        break;
      case ASTNodeType.IF_STATEMENT:
        this.checkIfStatement(statement);
        break;
      case ASTNodeType.WHILE_STATEMENT:
        this.checkWhileStatement(statement);
        break;
      case ASTNodeType.FOR_STATEMENT:
        this.checkForStatement(statement);
        break;
      case ASTNodeType.SWITCH_STATEMENT:
        this.checkSwitchStatement(statement);
        break;
      case ASTNodeType.RETURN_STATEMENT:
        this.checkReturnStatement(statement);
        break;
      default:
        // Add more cases as needed
        break;
    }
  }

  checkReturnStatement(statement) {
    const returnType = this.currentFunctionReturnType;
    if (!returnType) {
      throw new Error("Return statement not within a function.");
    }

    const returnExpressionType = this.inferExpressionType(statement.expression);
    if (returnType !== returnExpressionType) {
      throw new Error(
        `Type error: Function expected to return ${returnType}, but got ${returnExpressionType}.`
      );
    }
  }

  checkIfStatement(statement) {
    const { condition, thenBranch, elseBranch } = statement;

    // Ensure the condition is of boolean type
    const conditionType = this.inferExpressionType(condition);
    if (conditionType !== "boolean") {
      throw new Error(
        `Type error: Condition in 'if' statement must be a boolean, but got ${conditionType}.`
      );
    }

    // Check the 'then' branch
    for (const stmt of thenBranch.body) {
      this.checkStatement(stmt);
    }

    // Check the 'else' branch, if it exists
    if (elseBranch) {
      for (const stmt of elseBranch.body) {
        this.checkStatement(stmt);
      }
    }
  }

  // Check the while loop statement
  checkWhileStatement(statement) {
    const { condition, body } = statement;

    // Ensure the condition is of boolean type
    const conditionType = this.inferExpressionType(condition);
    if (conditionType !== "boolean") {
      throw new Error(
        `Type error: Condition in 'while' statement must be a boolean, but got ${conditionType}.`
      );
    }

    // Check the body of the while loop
    for (const stmt of body.body) {
      this.checkStatement(stmt);
    }
  }

  // Check the for loop statement
  checkForStatement(statement) {
    const { init, condition, increment, body } = statement;

    // Check the initialization part (usually a variable declaration or assignment)
    if (init) {
      this.checkStatement(init);
    }

    // Ensure the condition is of boolean type
    if (condition) {
      const conditionType = this.inferExpressionType(condition);
      if (conditionType !== "boolean") {
        throw new Error(
          `Type error: Condition in 'for' statement must be a boolean, but got ${conditionType}.`
        );
      }
    }

    // Check the increment part (usually an assignment or function call)
    if (increment) {
      this.checkStatement(increment);
    }

    // Check the body of the for loop
    for (const stmt of body.body) {
      this.checkStatement(stmt);
    }
  }

  // Check the switch statement
  checkSwitchStatement(statement) {
    const { discriminant, cases, defaultCase } = statement;

    // Check the discriminant (the expression being switched on)
    this.inferExpressionType(discriminant);

    // Check each case
    for (const caseClause of cases) {
      const caseType = this.inferExpressionType(caseClause.test);
      // You might want to enforce that the case type matches the discriminant type
      for (const stmt of caseClause.consequent.body) {
        this.checkStatement(stmt);
      }
    }

    // Check the default case, if it exists
    if (defaultCase) {
      for (const stmt of defaultCase.body) {
        this.checkStatement(stmt);
      }
    }
  }

  checkVariableDeclaration(declaration) {
    const { varType, id, value } = declaration;

    // Ensure the variable is not already declared
    if (this.symbolTable.has(id)) {
      throw new Error(`Variable ${id} is already declared.`);
    }

    // Check if the value assigned to the variable matches the declared type
    const valueType = this.inferExpressionType(value);
    if (varType !== valueType) {
      throw new Error(
        `Type error: Cannot assign ${valueType} to ${varType} variable ${id}.`
      );
    }

    // Store the variable in the symbol table
    this.symbolTable.set(id, varType);
  }

  checkFunctionDeclaration(declaration) {
    const { returnType, id, params, body } = declaration;

    // Ensure the function is not already declared
    if (this.functionTable.has(id)) {
      throw new Error(`Function ${id} is already declared.`);
    }

    // Store the function signature (return type and parameter types) in the function table
    const paramTypes = params.map((param) => param.type);
    this.functionTable.set(id, { returnType, paramTypes });

    // Set the current function return type
    this.currentFunctionReturnType = returnType;

    // Check the function body
    for (const statement of body.body) {
      this.checkStatement(statement);
    }

    // Clear the current function return type after checking
    this.currentFunctionReturnType = null;
  }

  checkBinaryExpression(expression) {
    const leftType = this.inferExpressionType(expression.left);
    const rightType = this.inferExpressionType(expression.right);

    if (leftType !== rightType) {
      throw new Error(
        `Type error: Cannot apply operator ${expression.operator} between ${leftType} and ${rightType}.`
      );
    }

    return leftType; // Assume the type of the result is the same as the operands
  }

  checkFunctionCall(call) {
    const { id, arguments: args } = call;
    
    // Special handling for the built-in print function
    if (id === "print") {
      // `print` can accept any number of arguments of any type
      args.forEach((arg) => {
        this.inferExpressionType(arg); // Just ensure each argument is valid
      });
      return "void"; // Assume `print` returns nothing
    }
    // Ensure the function is declared
    if (!this.functionTable.has(id)) {
      throw new Error(`Function ${id} is not declared.`);
    }

    const { returnType, paramTypes } = this.functionTable.get(id);

    // Ensure the correct number of arguments is provided
    if (args.length !== paramTypes.length) {
      throw new Error(
        `Function ${id} expects ${paramTypes.length} arguments, but got ${args.length}.`
      );
    }

    // Check each argument's type
    args.forEach((arg, index) => {
      const argType = this.inferExpressionType(arg);
      const expectedType = paramTypes[index];
      if (argType !== expectedType) {
        throw new Error(
          `Type error: Argument ${
            index + 1
          } of function ${id} expects ${expectedType}, but got ${argType}.`
        );
      }
    });

    return returnType; // The type of the function call expression is the function's return type
  }

  inferExpressionType(expression) {
    switch (expression.type) {
      case ASTNodeType.LITERAL:
        return this.inferLiteralType(expression.value);
      case ASTNodeType.IDENTIFIER:
        if (!this.symbolTable.has(expression.value)) {
          throw new Error(`Variable ${expression.value} is not declared.`);
        }
        return this.symbolTable.get(expression.value);
      case ASTNodeType.FUNCTION_CALL:
        return this.checkFunctionCall(expression);
      case ASTNodeType.BINARY_EXPRESSION:
        return this.checkBinaryExpression(expression);
      default:
        throw new Error(
          `Type inference not implemented for: ${expression.type}`
        );
    }
  }

  inferLiteralType(value) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return "int";
    } else if (typeof value === "number") {
      return "float";
    } else if (typeof value === "string" && value.length === 1) {
      return "char";
    } else if (typeof value === "string") {
      return "String";
    }
    throw new Error(`Unknown literal type for value: ${value}`);
  }
}

module.exports = TypeChecker;
