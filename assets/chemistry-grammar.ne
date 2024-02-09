@{%

const moo = require('moo');
const lexer = moo.compile({
    LB: { match: /(?:\n|\r\n)+/, lineBreaks: true },
    WS: { match: /[ \t\n\r]+/, lineBreaks: true },

    // Statement/Equation separator
    End: [';'],

    // Arrows
    Arrow: { match: /(?:<=>|->)/, type: moo.keywords({
        DArr: "<=>",
        SArr: "->"
    })},

    // Charges
    Charge: { match: /(?:-|\^{(?:[1-9][0-9]*)?(?:\+|\-)})/, type: moo.keywords({
        Positive: "^{+}",
        Negative: ["^{-}", "-"]
    })},

    // Subscripts
    Sub: /_{[1-9][0-9]*}/,

    // Non-zero naturals
    Num: /[1-9][0-9]*/,

    // Fractions
    Frac: /\\frac{[1-9][0-9]*}{[1-9[0-9]*}/,

    // State symbols
    State: /\((?:s|l|g|m|aq)\)/,

    // Chemical Elements
    Element:
    /A[cglmrstu]|B[aehikr]?|C[adeflmnorsu]?|D[bsy]|E[rsu]|F[elmr]?|G[ade]|H[efgos]?|I[nr]?|Kr?|L[airuv]|M[cdgnot]|N[abdehiop]?|O[gs]?|P[abdmortu]?|R[abefghnu]|S[bcegimnr]?|T[abcehilms]|U|V|W|Xe|Yb?|Z[nr]/,

    // Hydrate part
    Water: /.[\s]*(?:[1-9][0-9]*)?[\s]*H2O/,

    // Plus symbol
    // (it's hard to subtract chemicals)
    Plus: "+",

    // Parentheses
    LParen: "(",
    RParen: ")",
    LSquare: "[",
    RSquare: "]",

    // Electrons
    Electron: /(?:e|\\electron)\^{-}/,

    // Nop
    Nop: "{}",

    // Error (consumes characters until a match occurs again)
    Error: { match: /[^]/, lineBreaks: true },
})

%}

@lexer lexer


