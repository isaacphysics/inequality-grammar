# Inequality grammar

A grammar to parse linear-text maths and produce an AST that [Inequality](https://github.com/isaacphysics/inequality) can digest.

## Usage

    npm i --save inequality-grammar

```javascript
import { parseExpression } from 'inequality-grammar';

try {
    const output = parseExpression(this.mathInput);
    enjoy(output);
} catch (error) {
    // Handle error
}
```