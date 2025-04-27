# Aabacus Implementation Details

This document describes the current technical implementation of Aabacus. While the [core concepts](core-concepts.md) of Aabacus define its fundamental nature, the implementation details described here may evolve over time.

## MathMLContent Implementation

Aabacus currently implements the MathMLContent standard for representing mathematical expressions. MathMLContent is a markup language designed to encode the structure and content of mathematical notation.

### Mapping Between MathML and ENODEs

Each ENODE type in Aabacus corresponds to a specific element in MathMLContent:

| ENODE Type | MathML Representation |
|------------|----------------------|
| `plus`     | `<apply><plus/> ... </apply>` |
| `times`    | `<apply><times/> ... </apply>` |
| `exp`      | `<apply><power/> ... </apply>` |
| `or`       | `<apply><or/> ... </apply>` |
| `not`      | `<apply><not/> ... </apply>` |
| `and`      | `<apply><and/> ... </apply>` |
| `eq`       | `<apply><eq/> ... </apply>` |
| `cn`       | `<cn> ... </cn>` |
| `ci`       | `<ci> ... </ci>` |

### Example

A simple expression like `a + b = 2` would be represented in MathMLContent as:

```xml
<apply>
  <eq/>
  <apply>
    <plus/>
    <ci>a</ci>
    <ci>b</ci>
  </apply>
  <cn>2</cn>
</apply>
```

## DOM Implementation

The current implementation of Aabacus uses HTML DOM elements to represent ENODEs and expressions. Each ENODE is represented as a DOM element with specific attributes and child elements.

### ENODE DOM Structure

Each ENODE in the DOM is implemented as a `<div>` element with specific attributes and structure:

1. **Basic Structure**: An ENODE is a `<div>` with the `data-enode` attribute, where the value indicates the type of ENODE (e.g., "plus", "times", "or", etc.)

2. **Attributes**: Properties that define the node's behavior and appearance
   - `data-enode`: The type of the node (e.g., "plus", "times", "ci")
   - `data-type`: The data type of the node (e.g., "num", "bool")

3. **Content Structure**: ENODEs have different internal structures based on their type:
   
   - **ENODEs representing constants or identifiers** (`cn` and `ci`): Contain only a name div
     ```html
     <div data-enode="cn" data-type="num">
         <div class="name">1</div>
     </div>
     ```
   
   - **ENODEs representing functions**: Contain one or more "Role" divs that serve as containers for nested ENODEs
     ```html
     <div data-enode="plus" data-type="num">
         <div class="ol_role" data-type="num">
             <!-- Nested ENODEs go here -->
         </div>
     </div>
     ```
     ```html
     <div data-enode="forAll" data-type="bool">
         <div class="ol_role" data-type="num">
             <!-- Nested ENODEs go here -->
         </div>
     </div>
     ```
   - **ENODEs with multiple role containers**: Some ENODEs contain multiple role divs
   
    ```html
    <div data-enode="power" data-type="num">
			<div class="s_role base" data-type="num">
				<div class="power_decoration"></div>
			</div>
			<div class="s_role exponent" data-type="num"></div>
		</div>
    ```
    ```html
    <div data-enode="forAll" data-type="bool">
      <div class="row">
        <div class="forallSymbol">∀</div>
             <div class="bVar_role forAllHeader" data-type="obj">
                 <!-- Nested ENODEs go here -->
             </div>
         </div>
         <div class="s_role forAllContent" data-type="bool">
             <!-- Nested ENODEs go here -->
         </div>
     </div>
     ```

4. **Role Types**: Containers for child nodes
   - `s_role`: Single role, can contain only one child
   - `ol_role`: Ordered list role, can contain multiple children in a specific order
   - `ul_role`: Unordered list role, can contain multiple children the order is not relevant and can be changed without affecting the function result 
   - `bVar_role`: Bound variable role, used in quantifiers

### Root Expression Structure

The central expression of the application always has a root ENODE of type "and" with id="CanvasAnd". This root ENODE serves as the foundation of the entire expression system:

- It cannot be edited or dragged by the user
- It functions as a fixed base upon which users can build their expressions
- All user-created expressions are constructed as children of this immutable root element

```html
<div data-enode="and" data-type="bool" id="CanvasAnd">
    <div class="ul_role">
        <!-- User expressions are built here -->
    </div>
</div>
```

## User Interface Implementation

The current user interface of Aabacus is implemented using HTML, CSS, and JavaScript. It provides various ways for users to interact with expressions.

### Keyboard Shortcuts

The current implementation includes the following keyboard shortcuts:

- **Ctrl+C/Ctrl+V**: Copy and paste expressions
- **Shift+L**: Load expressions
- **Shift+S**: Save expressions
- **Arrow keys**: Decompose expressions or combine with adjacent elements
- **Ctrl+Z**: Undo operations

### Gesture Controls

The current implementation supports various gesture controls:

- **Drag-and-drop**: Move subexpressions
- **Click**: Select expressions
- **Double-click**: Edit expressions

## Visual Representation

The visual representation of expressions in the current implementation is handled through HTML and CSS. Each ENODE is represented as a DOM element with specific classes and attributes that determine its appearance.

### Visualization Settings



The current implementation allows users to customize the visualization of expressions through various settings:



- **Show/hide brackets**: Toggle the display of brackets around expressions
- **Vertical or horizontal display of multiplications**: Choose how multiplication operations are displayed
- **Display of reciprocals as 1/x**: Toggle between different representations of reciprocals
- **Color schemes**: Choose different color schemes for expressions

## Technical Implementation Details

### JavaScript Architecture

The current implementation uses a modular JavaScript architecture with the following key components:

- **Expression Manager**: Manages the creation, modification, and deletion of expressions
- **Pattern Matching System**: Identifies patterns in expressions for applying properties
- **Undo Manager**: Manages the undo/redo functionality
- **Save/Load System**: Handles saving and loading expressions

### CSS Implementation

The current implementation uses CSS for styling expressions. The CSS is organized into several files:

- **style.css**: Main styling for the application
- **SVGstyle.css**: Styling for SVG elements
- **fromJQExamples.css**: Styles adapted from jQuery UI examples
- **pseudoEl.css**: Styles for pseudo-elements
- **sortableTest.css**: Styles for sortable elements

## Future Implementation Considerations

While the core concepts of Aabacus will remain stable, the implementation details described in this document may evolve over time. Future implementations might consider:


- **Advanced visualization techniques**: For more intuitive representation of expressions
- **Touch Device Support**: The current version works well with mouse and keyboard, but a key development goal is to optimize for touch devices, particularly tablets due to their ideal screen size for mathematical manipulation. Future implementation will include:
  - Gesture recognition for common mathematical operations (pinch-to-zoom, swipe-to-combine terms)
  - Touch-friendly UI elements with appropriate sizing for finger interaction
  - Multi-touch support for simultaneous manipulation of expression components
  - Haptic feedback for improved user experience when manipulating expressions
  - Adaptive layouts that respond to device orientation and screen dimensions
- **Modern JavaScript frameworks**: For better maintainability and developer experience
