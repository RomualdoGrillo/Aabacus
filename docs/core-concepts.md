# Aabacus Core Concepts

## Introduction

Aabacus is a web application designed to visualize and manipulate mathematical expressions through a series of gestures like drag-and-drop and keyboard commands.

## Expression Structure

### What is an Expression?

In Aabacus, an "Expression" is a logical-mathematical structure represented as a tree. Each node in this tree corresponds to a mathematical function. The structure follows the MathMLContent standard, which is a markup language for describing mathematical notation.

### Expression Nodes (ENODEs)

The fundamental building blocks of expressions in Aabacus are called "ENODEs" (Expression Nodes). Each ENODE represents a specific mathematical function or operation.

#### ENODE Types

There are dozens of ENODE types, each representing different mathematical operations. Some common types include:

- **plus**: Represents addition operations
- **times**: Represents multiplication operations
- **and**: Represents logical conjunction
- **eq**: Represents equations or definitions
- **cn**: Represents numbers (constants)

#### ENODE Structure

Gli ENODE sono caratterizzati da una uscita ed una o più entrate, tranne gli identificatori che non hanno alcuna entrata. Ogni ingresso o entrata ha un datatype che può essere: num, bool, obj, ecc.

Ogni ENODE ha:

1. **Attributes**: Properties that define the node's behavior and appearance
   - `data-enode`: The type of the node (e.g., "plus", "times", "ci")
   - `data-type`: The data type of the node (e.g., "num", "bool")
   - `data-proto`: Reference to the prototype used to create the node

2. **Roles**: Containers for child nodes
   - `s_role`: Single role, can contain only one child
   - `ol_role`: Ordered list role, can contain multiple children in a specific order
   - `ul_role`: Unordered list role, can contain multiple children in any order
   - `bVar_role`: Bound variable role, used in quantifiers

3. **Methods**: Functions that operate on the node
   - `ENODE_getName()`: Gets the name of the node
   - `ENODE_setName()`: Sets the name of the node
   - `ENODE_getChildren()`: Gets the children of the node
   - `ENODE_getRoles()`: Gets the roles of the node
   - `ENODE_dissolveContainer()`: Removes the node and promotes its children

## MathMLContent Implementation

Aabacus implements the MathMLContent standard for representing mathematical expressions. MathMLContent is a markup language designed to encode the structure and content of mathematical notation.

### Mapping Between MathML and ENODEs

Each ENODE type in Aabacus corresponds to a specific element in MathMLContent:

- `plus` → `<apply><plus/> ... </apply>`
- `times` → `<apply><times/> ... </apply>`
- `eq` → `<apply><eq/> ... </apply>`
- `ci` → `<ci> ... </ci>`
- `cn` → `<cn> ... </cn>`

### Example

A simple expression like `a + b` would be represented in MathMLContent as:

```xml
<apply>
  <plus/>
  <ci>a</ci>
  <ci>b</ci>
</apply>
```

In Aabacus, this would be represented as a tree with a `plus` ENODE as the root, and two `ci` ENODEs as children.

## Expression Manipulation

Aabacus can perform two kind of actions on the Expression:
1) Editing
2) Applying properties

### Editing
When the expression is in Unlocked state, it can be edited by adding new ENODES from the palette, loading new expressions from a file, moving subexpressions via drag-and-drop or with keyboard commands. 
- Ctrl+C/Ctrl+V: Copy and paste expressions
- Shift+L: Load expressions
- Shift+S: Save expressions

Aabacus enforces type compatibility to ensure that only valid operations are performed.

### Applying properties
When the expression is in Locked state, users can only apply mathematical properties.
Applicare proprietà ha l'effetto di sostituire parti dell'espressione con altre espressioni equivalenti all'originale, di conseguenza nello stato locked si può cambiare la forma ma non la sosatanza dell'espressione.
Esistono diversi modi di applicare proprietà:
1) Select an expression and then apply a property (using keyboard shortcuts or selecting from available properties). The pattern matching system identifies if the selected expression matches the pattern required by the property, and if so, applies the transformation.
2) Drag terms to apply commutative, associative, distributive properties or to replace a term in a equation system


### Keyboard Commands

Various keyboard shortcuts allow for quick manipulation of expressions:

- Arrow keys: Decompose expressions or combine with adjacent elements
- Ctrl+Z: Undo operations
## Visual Representation

The visual representation of expressions in Aabacus is handled through HTML and CSS. Each ENODE is represented as a DOM element with specific classes and attributes that determine its appearance.

### Visualization Settings

Users can customize the visualization of expressions through various settings:

- Show/hide brackets
- Vertical or horizontal display of multiplications
- Display of reciprocals as 1/x
- Color schemes

## Expression Storage and Exchange

Expressions in Aabacus can be saved and loaded in different formats:

- `.mml`: MathML format for storing individual expressions
- `.mmls`: A custom format for storing multiple expressions and their relationships

Saving and loading expressions allows users to:
- Save their work for later continuation
- Share expressions with other users
- Build libraries of common expressions and properties
