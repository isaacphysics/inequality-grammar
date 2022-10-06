# Inequality grammar

A grammar to parse linear-text maths and boolean expressions, and produce an AST
that [Inequality](https://github.com/isaacphysics/inequality) can digest.

## Usage

    npm i --save inequality-grammar

```javascript
import { parseMathsExpression } from 'inequality-grammar';

try {
    const output = parseMathsExpression(this.mathInput);
    enjoy(output);
} catch (error) {
    // Handle error
}
```

## Documentation

This parser turns linear-text maths and boolean expressions into the
left-to-right AST format used by [Inequality](https://github.com/isaacphysics/inequality).
For more information on the AST, please refer to Inequality's documentation.

This parser is based on [nearley.js](https://nearley.js.org/), a parser toolkit
for JavaScript. Nearley uses the [Earley algorithm](https://en.wikipedia.org/wiki/Earley_parser)
plus clever optimizations to process expressions with high efficiency and low
computational effort -- if the grammar rules are specified the right way.

The two grammars are found in the `assets` folders and contain inline
documentation. Some of the processing functions may seem complicated but this is
primarily due to the left-to-right nature of the AST they need to produce.
Keeping track of the tokens produced by each rule is essential to understand
the processing functions, but not the easiest thing. Take it slowly and
everything will eventually make sense.
