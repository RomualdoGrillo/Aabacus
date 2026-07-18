!!!GOV level:1objective requiredApprovalFrom:Romualdo

# Aabacus Core Concepts

This document describes the fundamental concepts of Aabacus. These core concepts define what Aabacus is and how it works at a conceptual level. For technical implementation details, please see the [implementation details](implementation-details.md) document.

## Introduction

Aabacus is an educational tool for visualizing and manipulating mathematical expressions. In Aabacus, a mathematical expression is **represented** by an **ExpressionTree**; the two are not the same thing. The ExpressionTree is the structured object the user builds, edits, and transforms through interaction.

## ExpressionNodes and ExpressionTree

Aabacus is built around a tree structure called the **ExpressionTree**.

### Expression Nodes (ENODEs)

The fundamental building blocks of the ExpressionTree are called **ENODEs** (Expression Nodes). Each ENODE represents a function.

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


When building the ExpressionTree, Aabacus enforces data type compatibility between the outputs and inputs of connected ENODEs.  
Note that the data type `obj` means any data type is accepted as input, which is useful for operations like equality that can compare multiple types of objects.

### Minimal ExpressionTree example

The equation `a + b = 2` can be represented as an ExpressionTree where:

- The root node is an `eq` ENODE (representing equality)
- The left child of the root is a `plus` ENODE (representing addition)
- The children of the `plus` ENODE are two `ci` ENODEs (representing the variables a and b)
- The right child of the root is a `cn` ENODE (representing the constant 2)

This tree structure precisely captures the mathematical meaning of the equation.

## One omnicomprehensive ExpressionTree

Both content and properties are encoded in the ExpressionTree.
Using logical and mathematical functions it is possible to construct a very articulated system of logical and mathematical propositions.
As an example let's start from the system of two equations:

⎧ y=x-1
⎨ 
⎩ x*y=6

In Aabacus, `a = b` is simply interpreted as "you can replace a with b or replace b with a", and you will obtain a form of the ExpressionTree that is equivalent to the original.

What are equivalent forms of the ExpressionTree?
The ExpressionTree is a composed function. Two forms of the ExpressionTree are considered equivalent if they produce the same outputs when given the same inputs. In mathematical terms, this means that although two forms may look different in their structure or representation, they are functionally identical if they yield the same results for all possible input values.

## Manipulating the ExpressionTree

Aabacus distinguishes three states for (parts of) the ExpressionTree:


| State      | Meaning                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **untied** | Free construction: ENODEs can be added, removed, moved, copied (still subject to data-type checks).                                                        |
| **tied**   | Definitions are binding: free structural editing is not allowed; the tree may still be transformed by applying properties that live in the ExpressionTree. |
| **frozen** | No transformation of any kind is allowed on that part.                                                                                                     |




### 1. Untied (editing / construction)

When a definition or the canvas is **untied**, it can be freely edited. This includes:

- Adding new ENODEs
- Removing ENODEs
- Moving subexpressions around
- Copying and pasting subexpressions

Type compatibility still prevents datatype mismatches.

### 2. Tied (property application)

When a definition is made **tied**, it becomes binding: you no longer rearrange it freely, but you can still transform the ExpressionTree according to the equations and properties written within it.

Returning to our example:

⎧ y=x-1
⎨ 
⎩ x*y=6

The only possible transformation is to substitute y with x-1. No other properties can be applied unless they are explicitly written in the ExpressionTree.

To solve algebraic problems, fundamental properties must be included in the ExpressionTree. For example, to work with the system above, you might need the distributive property:

⎧ ∀ a, b, c ∈ ℝ :   a(b + c) = ab + ac
|
⎨ y=x-1
| 
⎩ x*y=6

## Properties: PM and HardWired

### PM properties

PM properties are applied through pattern matching. In the ExpressionTree they appear as a subtree that contains an `eq` ENODE (as in the earlier example `y = x - 1`) or an `implies` ENODE, optionally wrapped in a `forAll` ENODE.

### Hard-wired properties

Some properties are still hard to express using equations alone. For that reason they are implemented as procedures in the application source code. They can be applied only if the ExpressionTree contains a dedicated element that refers to the property.


## Applying properties

You can apply a single property to a suitable subexpression, or apply a list of properties with one macro command. **Macros make it faster and more convenient to reach a result, but they do not enlarge the set of obtainable results: the user can reach the same result without macros by applying properties one by one.**

In practice, properties (and macros) can be triggered by various user actions:

1. Select a subexpression and press a key. Pattern matching checks whether it matches the property pattern and, if so, applies the transformation.
2. Drag terms to apply commutative, associative, or distributive properties, or to replace a term in a system of equations.
3. … (other actions to be listed)



### Typical workflow

1. The user creates the ExpressionTree or loads it from a file (often **untied** while building definitions).
2. Definitions are made **tied** (binding).
3. In the tied state, the user applies properties to:
  - Prove theorems
  - Deduce logical consequences
  - Simplify expressions
  - Solve equations or systems
