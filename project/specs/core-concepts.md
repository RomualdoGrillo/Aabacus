!!!GOV level:1objective requiredApprovalFrom:Romualdo

# Aabacus Core Concepts

This document define what Aabacus is and how it works at a conceptual level. For technical implementation details, please see the [implementation details](implementation-details.md) document.

## Introduction

Aabacus is an educational tool for visualizing and manipulating mathematical expressions.
## ExpressionNodes and ExpressionTree

Aabacus is built around a tree structure called the **ExpressionTree** used to encode any mathematical or logical content.

### Expression Nodes (ENODEs)

The fundamental building blocks of the ExpressionTree are called **ENODEs** (Expression Nodes). Each ENODE represents a function.

ENODEs are characterized by one output and zero, one, or more inputs. The output and inputs of an ENODE have specific data types (such as number, boolean, etc.) that determine what kinds of connections are valid.

ENODEs with zero inputs are leaf nodes they represent constants and identifiers.

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
The ExpressionTree root element is the definition Enode.
 
### Minimal ExpressionTree example

The equation `a + b = 2` can be represented as an ExpressionTree where:

- The root node is an `eq` ENODE (representing equality)
- The left child of the root is a `plus` ENODE (representing addition)
- The children of the `plus` ENODE are two `ci` ENODEs (representing the variables a and b)
- The right child of the root is a `cn` ENODE (representing the constant 2)

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

| State      | Meaning |
| ---------- | ------- |
| **untied** | Free construction of structure (add, remove, move, copy ENODEs), still subject to data-type checks. |
| **tied**   | No free structural editing; only transformations allowed by the properties present in the ExpressionTree (see below). |
| **frozen** | No transformation of any kind on that part. |

### Untied

When a definition or the canvas is **untied**, the user builds or rearranges structure freely (within type rules).

### Tied

When a definition is **tied**, it is binding: free editing stops. The available properties limit which transformations are allowed; the reachable forms are exactly the **equivalent** forms of the ExpressionTree (as defined above).

Example — with only this system tied:

⎧ y=x-1
⎨
⎩ x*y=6

the only applicable transformation is substituting `y` with `x-1`. To unlock further steps (e.g. distribution), those properties must also appear in the ExpressionTree:

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

In practice, single properties and macros can be triggered by various user actions:

1. Select a subexpression and press a key. Pattern matching checks whether it matches the property pattern and, if so, applies the transformation.
2. Drag terms to apply commutative, associative, or distributive properties, or to replace a term in a system of equations.
3. … (other actions to be listed)



### Typical workflow

1. The user creates the ExpressionTree or loads it from a file (often **untied** while building).
2. Relevant definitions are made **tied**.
3. The user applies properties to:
  - Prove theorems
  - Deduce logical consequences
  - Simplify expressions
  - Solve equations or systems
