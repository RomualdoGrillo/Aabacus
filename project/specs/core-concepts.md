!!!GOV level:1objective requiredApprovalFrom:Romualdo

# Aabacus Core Concepts

This document describes the fundamental concepts of Aabacus. These core concepts define what Aabacus is and how it works at a conceptual level. For technical implementation details, please see the [implementation details](implementation-details.md) document.

## Introduction

Aabacus is an application designed to visualize and manipulate mathematical expressions. It provides a structured environment where users can build, edit, and transform mathematical expressions through a series of interactions. Aabacus is mainly intended as an educational tool.

## ExpressionNodes and ExpressionTree

Aabacus is built around a tree structure called **The ExpressionTree**.

### Expression Nodes (ENODEs)

The fundamental building blocks of The ExpressionTree are called **ENODEs** (Expression Nodes). Each ENODE represents a function.

ENODEs are characterized by one output and zero, one, or more inputs. The output and inputs of an ENODE have specific data types (such as number, boolean, etc.) that determine what kinds of connections are valid.

Leaf ENODEs have no inputs: constants and identifiers are leaf nodes.

#### ENODE Types

The following table describes some of the most common ENODE types:


| ENODE Type | Description              | Output Data Type | Input Data Types | Example   |
| ---------- | ------------------------ | ---------------- | ---------------- | --------- |
| `plus`     | Addition operation       | num              | num, num, ...    | a + b + c |
| `times`    | Multiplication operation | num              | num, num, ...    | a × b × c |
| `exp`      | Power operation          | num              | num, num         | a^b       |
| `or`       | Logical disjunction      | bool             | bool, bool, ...  | a ∨ b     |
| `not`      | Logical negation         | bool             | bool             | ¬a        |
| `and`      | Logical conjunction      | bool             | bool, bool, ...  | a ∧ b     |
| `eq`       | Equation or definition   | bool             | obj, obj         | a = b     |
| `cn`       | Number constant          | num              | none             | 5         |
| `ci`       | Identifier/variable      | varies           | none             | x         |


When building The ExpressionTree, Aabacus enforces data type compatibility between the outputs and inputs of connected ENODEs.   
Note that the data type `obj` means any data type is accepted as input, which is useful for operations like equality that can compare multiple tipes of objects.

### Minimal ExpressionTree example

The equation `a + b = 2` can be represented as The ExpressionTree where:

- The root node is an `eq` ENODE (representing equality)
- The left child of the root is a `plus` ENODE (representing addition)
- The children of the `plus` ENODE are two `ci` ENODEs (representing the variables a and b)
- The right child of the root is a `cn` ENODE (representing the constant 2)

This tree structure precisely captures the mathematical meaning of The ExpressionTree.

## One omnicomprehensive ExpressionTree

Both content and properties are encoded in The ExpressionTree.
Using logical and mathematical functions it is possible to construct a very articulated system of logical and mathematical propositions.
As an example let's start from the system of two equations:

⎧ y=x-1
⎨ 
⎩ x*y=6

In Aabacus, `a = b` is simply interpreted as "you can replace a with b or replace b with a", and you will obtain a form of The ExpressionTree that is equivalent to the original.

What are equivalent forms of The ExpressionTree?
The ExpressionTree is a composed function. Two forms of The ExpressionTree are considered equivalent if they produce the same outputs when given the same inputs. In mathematical terms, this means that although two forms may look different in their structure or representation, they are functionally identical if they yield the same results for all possible input values.

## Expression Manipulation

Aabacus supports two fundamental modes of expression manipulation:

### 1. Editing Mode

When an expression is in "Unlocked" state, it can be freely edited. This includes:

- Adding new ENODEs to the expression
- Removing ENODEs from the expression
- Moving subexpressions around
- Copying and pasting parts of expressions

During editing, Aabacus enforces type compatibility to ensure that only valid operations are performed. This helps users build mathematically correct expressions.

### 2. Property Application Mode

When an expression is "Locked", all editing operations become impossible. The expression can only be transformed according to the equations written within it.

Returning to our example:

⎧ y=x-1
⎨ 
⎩ x*y=6

The only possible transformation is to substitute y with x-1. No other properties can be applied unless they are explicitly written in the expression.

To solve algebraic problems, it's necessary to include fundamental properties in the expression. For example, to work with the system above, you might need to include the distributive property:

⎧ ∀ a, b, c ∈ ℝ :   a(b + c) = ab + ac
|
⎨ y=x-1
| 
⎩ x*y=6

Applying properties has the effect of replacing parts of the expression with other expressions that are equivalent to the original. There are different ways to apply properties:

1. Select an expression and then apply a property. The pattern matching system identifies if the selected expression matches the pattern required by the property, and if so, applies the transformation.
2. Drag terms to apply commutative, associative, distributive properties, or to replace a term in an equation system.

##The typical use of Aabacus follows this workflow:

1. The user creates a new expression or loads it from a file
2. The expression is locked
3. In the locked state, the user applies properties to:
  - Prove theorems
  - Deduce logical consequences
  - Simplify expressions
  - Solve equations or systems

