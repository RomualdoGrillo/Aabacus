# Aabacus Core Concepts

This document describes the fundamental concepts of Aabacus. These core concepts define what Aabacus is and how it works at a conceptual level. For technical implementation details, please see the [implementation details](implementation-details.md) document.

## Introduction

Aabacus is an application designed to visualize and manipulate mathematical expressions. It provides a structured environment where users can build, edit, and transform mathematical expressions through a series of interactions.

## Expression Model

### What is an Expression?

In Aabacus, an "Expression" is a logical-mathematical structure represented as a tree. Each node of the tree corresponds to a mathematical function or operation. This tree structure allows for the representation of complex mathematical expressions in a way that preserves their logical structure.

An expression is built by connecting nodes together, where the output of one node serves as the input to another node. This creates a hierarchical structure that represents the mathematical relationships between different parts of the expression.

### Expression Nodes (ENODEs)

The fundamental building blocks of expressions in Aabacus are called "ENODEs" (Expression Nodes). Each ENODE represents a specific mathematical function or operation.

ENODEs are characterized by one output and zero, one, or more inputs. The output and inputs of an ENODE have specific data types (such as number, boolean, etc.) that determine what kinds of connections are valid.

Identifiers (variables) and constants are special types of ENODEs that have no inputs - they only have outputs.

#### ENODE Types

There are dozens of ENODE types, each representing different mathematical operations. The following table describes some of the most common ENODE types:

| ENODE Type | Description                  | Output Data Type | Input Data Types   | Example     |
|------------|------------------------------|------------------|-------------------|-------------|
| `plus`     | Addition operation           | num              | num, num, ...     | a + b + c   |
| `times`    | Multiplication operation     | num              | num, num, ...     | a × b × c   |
| `exp`      | Power operation              | num              | num, num          | a^b         |
| `or`       | Logical disjunction          | bool             | bool, bool, ...   | a ∨ b       |
| `not`      | Logical negation             | bool             | bool              | ¬a          |
| `and`      | Logical conjunction          | bool             | bool, bool, ...   | a ∧ b       |
| `eq`       | Equation or definition       | bool             | obj, obj          | a = b       |
| `cn`       | Number constant              | num              | none              | 5           |
| `ci`       | Identifier/variable          | varies           | none              | x           |

When building an expression, Aabacus enforces data type compatibility between the outputs and inputs of connected ENODEs. This ensures that only mathematically valid expressions can be constructed.

Note that the data type 'obj' means any data type is accepted as input, which is useful for operations like equality that can compare different types of mathematical objects.

### Expression Example

The mathematical expression `a + b = 2` can be represented as a tree structure where:

- The root node is an `eq` ENODE (representing equality)
- The left child of the root is a `plus` ENODE (representing addition)
- The children of the `plus` ENODE are two `ci` ENODEs (representing the variables a and b)
- The right child of the root is a `cn` ENODE (representing the constant 2)

This tree structure precisely captures the mathematical meaning of the expression.

## Expression Manipulation Paradigms

Aabacus supports two fundamental modes of expression manipulation:

### 1. Editing Mode

When an expression is in "Unlocked" state, it can be freely edited. This includes:

- Adding new ENODEs to build or extend the expression
- Removing ENODEs from the expression
- Moving subexpressions around
- Copying and pasting parts of expressions

During editing, Aabacus enforces type compatibility to ensure that only valid operations are performed. This helps users build mathematically correct expressions.

### 2. Property Application Mode

When an expression is in "Locked" state, users can only apply mathematical properties to transform the expression. This mode ensures that the mathematical meaning of the expression is preserved while allowing its form to be changed.

Applying properties has the effect of replacing parts of the expression with other expressions that are equivalent to the original. This allows users to transform expressions while maintaining their mathematical validity.

There are different ways to apply properties:

1. Select an expression and then apply a property. The pattern matching system identifies if the selected expression matches the pattern required by the property, and if so, applies the transformation.

2. Drag terms to apply commutative, associative, distributive properties, or to replace a term in an equation system.

Common mathematical properties that can be applied include:

- Commutative properties (e.g., a + b = b + a)
- Associative properties (e.g., (a + b) + c = a + (b + c))
- Distributive properties (e.g., a × (b + c) = a × b + a × c)
- Identity properties (e.g., a + 0 = a, a × 1 = a)
- Inverse properties (e.g., a + (-a) = 0, a × (1/a) = 1)

By switching between these two modes, users can both construct expressions and explore their mathematical properties in a structured and educational way.
