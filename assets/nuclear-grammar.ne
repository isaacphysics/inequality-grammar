@{%

const moo = require('moo');
const lexer = moo.compile({
    LB: { match: /(?:\n|\r\n)+/, lineBreaks: true },
    WS: { match: /[ \t\n\r]+/, lineBreaks: true },

    // Statement/Equation separator
    End: [';'],

    // Arrows
    SArr: "->",

    // Mass and Atomic numbers
    Mass: /\^{(?:[1-9][0-9]*|0)}/,
    Atomic: /_{(?:[1-9][0-9]*|0)}/,

    // Charges
    Charge: { match: /(?:-|\^{(?:[1-9][0-9]*)?(?:\+|\-)})/, type: moo.keywords({
        Positive: "^{+}",
        Negative: ["^{-}", "-"]
    })},

    // Non-zero naturals
    Num: /[1-9][0-9]*/,

    // Fractions
    Frac: /\\frac{[1-9][0-9]*}{[1-9[0-9]*}/,

    // Chemical Elements
    Element:
    /A[cglmrstu]|B[aehikr]?|C[adeflmnorsu]?|D[bsy]|E[rsu]|F[elmr]?|G[ade]|H[efgos]?|I[nr]?|Kr?|L[airuv]|M[cdgnot]|N[abdehiop]?|O[gs]?|P[abdmortu]?|R[abefghnu]|S[bcegimnr]?|T[abcehilms]|U|V|W|Xe|Yb?|Z[nr]/,

    // Plus symbol
    // (it's hard to subtract chemicals)
    Plus: "+",

    // Parentheses
    LParen: "(",
    RParen: ")",
    LSquare: "[",
    RSquare: "]",
//    LCurl: "{", // If these are required they will need to got below Nop
//    RCurl: "}",

    // Particles
    Alpha: "\\alphaparticle",
    Beta: "\\betaparticle",
    Gamma: "\\gammaray",
    Neutrino: "\\neutrino",
    AntiNeutrino: "\\antineutrino",
    Electron: /(?:e\^{-}|\\electron\^{-}|\\electron)/,
    Positron: "\\positron",
    Neutron: "\\neutron",
    Proton: "\\proton",

    // Nop
    Nop: "{}",

    // Error (consumes characters until a match occurs again)
    Error: { match: /[^]/, lineBreaks: true },
})

%}

@lexer lexer


