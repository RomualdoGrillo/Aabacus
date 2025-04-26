# Aabacus Core Concepts

This document describes the fundamental concepts of Aabacus. These core concepts define what Aabacus is and how it works at a conceptual level. For technical implementation details, please see the [implementation details](implementation-details.md) document.

## Introduction

Aabacus is an application designed to visualize and manipulate mathematical expressions. It provides a structured environment where users can build, edit, and transform mathematical expressions through a series of interactions. Aabacus is mainly intended as an educational tool.

## Expression Model

### What is an Expression?

Aabacus provides a set of fundamental functions, function can be composed connecting the output of one function to one of the inputs of another. Composing functions produces a tree structure that is called "Expression".
This creates a hierarchical structure that represents the mathematical relationships between different parts of the expression. The expression has a tree structure where nodes are functions, those nodes are called ENODEs that stand for ExpressionNodes.

### Expression Nodes (ENODEs)

The fundamental building blocks of expressions in Aabacus are called "ENODEs" (Expression Nodes). Each ENODE represents a specific mathematical function or operation.

ENODEs are characterized by one output and zero, one, or more inputs. The output and inputs of an ENODE have specific data types (such as number, boolean, etc.) that determine what kinds of connections are valid.

Identifiers (variables) and constants are special types of ENODEs that have no inputs.

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

## One only omnicomprensive Expression

Using Logical and Mathematical function it is possible to construct a very articulated systems of logic Mathematical propositions.
You can both write properties and expressions in a big omicomprensive expression.
As an example let's start from the system of two equations:

⎧ y=x-1
⎨ 
⎩ x*y=6

In Aabacus a = b is simply interpreted as "you can replace a with b  or replace b with a" and you will obtain an expression that'equivalent to the original.

What are equivalent expressions?
An expression is a composed function. Two expressions are considered equivalent if they produce the same outputs when given the same inputs. In mathematical terms, this means that although two expressions may look different in their structure or representation, they are functionally identical if they yield the same results for all possible input values.


## Expression Manipulation

Aabacus supports two fundamental modes of expression manipulation:

### 1. Editing Mode

When an expression is in "Unlocked" state, it can be freely edited. This includes:

- Adding new ENODEs to build or extend the expression
- Removing ENODEs from the expression
- Moving subexpressions around
- Copying and pasting parts of expressions

During editing, Aabacus enforces type compatibility to ensure that only valid operations are performed. This helps users build mathematically correct expressions.

### 2. Property Application Mode

Quando una espressione viene "bloccata" ogni operazione di editing diventa impossibile. L'espressione non può cambiare se non coerentemente con le equazioni che nell'espressione sono scritte.
Tornando all'esempio 

⎧ y=x-1
⎨ 
⎩ x*y=6

l'unica trasformazione possibile è sostituire y con  x-1. Non posso applicare altre proprietà che non sono scritte nell'espressione.
Ovviamente per svolgere problemi di algebra è necessario inserire almeno le porietà fondamentali nell'espressione 
Per esempio inserire nel sistema si deve inserire la proprietà distributiva:

⎧ ∀ a, b, c ∈ ℝ :   a(b + c) = ab + ac
|
⎨ y=x-1
| 
⎩ x*y=6


Applying properties has the effect of replacing parts of the expression with other expressions that are equivalent to the original. 
There are different ways to apply properties:

1. Select an expression and then apply a property. The pattern matching system identifies if the selected expression matches the pattern required by the property, and if so, applies the transformation.

2. Drag terms to apply commutative, associative, distributive properties, or to replace a term in an equation system.


The tipical use of Aabacus is the following:
1)The user creates a new expression or loads it from a file.
2)The expression is locked
3)In locked state the user applies properties to prove Theorems, to deduce logical consequences, to simplify expressionscan etc..
