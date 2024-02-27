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
    Charge: { match: /(?:-|\^{(?:[1-9][0-9]*)?(?:\+|-)})/, type: moo.keywords({
        Positive: "^{+}",
        Negative: ["^{-}", "-"]
    })},

    // Subscripts
    Sub: /_{[1-9][0-9]*}/,

    // Non-zero naturals
    Num: /[1-9][0-9]*/,

    // Fractions
    Frac: /\\frac{[1-9][0-9]*}{[1-9[0-9]*}/,
    Slash: ['/'],

    // State symbols
    State: /\((?:s|l|g|m|aq)\)/,

    // Chemical Elements
    Element:
    /A[cglmrstu]|B[aehikr]?|C[adeflmnorsu]?|D[bsy]|E[rsu]|F[elmr]?|G[ade]|H[efgos]?|I[nr]?|Kr?|L[airuv]|M[cdgnot]|N[abdehiop]?|O[gs]?|P[abdmortu]?|R[abefghnu]|S[bcegimnr]?|T[abcehilms]|U|V|W|Xe|Yb?|Z[nr]/,

    // Hydrate part
    Water: /\.[\s]*(?:[1-9][0-9]*)?[\s]*H2O/,

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

/* 
Process the main statement.
This just wraps the AST so that the high level object has
the same properties.
*/
const processMain = (d) => {
    return { result: d[1] };
}

/*
Process a statement.
A statement has two expressions and an arrow.
None of these need processing.
*/
const processStatement = (d) => {
    return {
        type: 'statement',
        left: d[0],
        right: d[4],
        arrow: d[2].type
    };
}

/*
Process an expression.
An expression is a cons-list of terms that have been summed together.
TODO: Look at using standard lists
*/
const processExpression = (d) => {
    return {
        type: 'expr',
        term: d[0],
        rest: d[4]
    };
}

/*
Process an ion term.
A term is some ion, electron, or hydrate. In this case only the ion.
*/
const processTerm = (d) => {
    return {
        type: 'term',
        value: d[1],
        coeff: d[0],
        state: d[2],
        hydrate: 0,
        isElectron: false,
        isHydrate: false
    };
}

/*
Process a hydrate term.
A term is some ion, electron, or hydrate. In this case only the hydrate.
Processing on the hydrate to extract the value needs to be done.
*/
const processHydrateTerm = (d) => {
    const regex = /\.\s*(?<num>[1-9][0-9]*)\s*H2O/;
    const matches = d[3].text.match(regex);

    return {
        type: 'term',
        value: d[1],
        coeff: d[0],
        state: d[4],
        hydrate: parseInt(matches.groups.num),
        isElectron: false,
        isHydrate: true
    };
}

/*
Process an electron term.
A term is some ion, electron, or hydrate. In this case only the electron.
Placeholder values are included to prevent unnecessary checks at runtime.
*/
const processElectronTerm = (d) => {
    return {
        type: 'term',
        value: d[1],
        coeff: d[0],
        state: {},
        hydrate: 0,
        isElectron: true,
        isHydrate: false
    };
}

/*
Process an ion.
An ion is a molecule with a charge.
The charge can have a value and be positive or negative.
*/
const processIon = (d) => {
    return {
        type: 'ion',
        molecule: d[0],
        charge: d[1],
    };
}

/*
Process an ion chain.
An ion chain is a string of ions together.
The charges can have a value and be positive or negative.
*/
const processIonChain = (d) => {
    // TODO: Look at using lists rather than cons-lists

    return {
        type: 'ion',
        molecule: d[0],
        charge: d[1],
        chain: d[2]
    };
}

/*
Process a compound.
A compound is a cons-list of elements and brackets.
The parser deals with the fact that a compound must have
at least two elements but can have only 1 bracket.
*/
const processCompound = (d) => {
    return {
        type: 'compound',
        head: d[0],
        tail: d[1]
    };
}

/*
Process a bracket.
A bracket is a compound that can be repeated multiple times.
*/
const processBracket = (d) => {
    return {
        type: 'bracket',
        compound: d[1],
        coeff: d[3]
    };
}

/*
Process an element.
An element may have a coefficient (such as O2).
*/
const processElement = (d) => {
    return {
        type: 'element',
        value: d[0].text,
        coeff: d[1]
    };
}

/*
Process an element with subscript.
An element with a subscript coefficient (such as O_{2}).
*/
const processElementSub = (d) => {
    const regex = /_{(?<num>[1-9][0-9]*)}/;
    const matches = d[1].text.match(regex);

    return {
        type: 'element',
        value: d[0].text,
        coeff: parseInt(matches.groups.num)
    };
}

/*
Process a charge.
Extract the charge coefficient and sign.
*/
const processCharge = (d) => {
    const regex = /\^{(?<value>[1-9][0-9]*)(?<sign>\+|-)}/;
    const matches = d[0].text.match(regex);

    if (matches.groups.sign === '-') {
        return 0 - parseInt(matches.groups.value);
    } else {
        return parseInt(matches.groups.value);
    }
}

/*
Process a number.
Return the coefficient parsed as a integer.
For consistency this is made into a trivial fraction.
*/
const processNumber = (d) => {
    const number = parseInt(d[0].value)

    return {
        numerator: number,
        denominator: 1
    };
}

/*
Process a fraction.
Extract the numerator and denominator from the test.
Return this as a fraction object.
*/
const processFraction = (d) => {
    const regex = /\\frac{(?<num>[1-9][0-9]*)}{(?<den>[1-9[0-9]*)}/;
    const match = d[0].text.match(regex);

    return {
        numerator: parseInt(match.groups.num),
        denominator: parseInt(match.groups.den)
    };
}

/*
Process a fraction.
It is possible to write a fraction as `<num>/<num>`.
Much easier to extract numbers from.
*/
const processSlash = (d) => {
    return {
        numerator: parseInt(d[0].text),
        denominator: parseInt(d[2].text)
    };
}

/*
Process an error.
The lexer my not be able to lex a token.
This can be propagated to be processed by the checker.
*/
const processError = (d) => {
    return {
        type: 'error',
        value: d[0].value,
        loc: (-1, -1) // Placeholder value as unknown
    };
}

/*
Process an error with leading term.
An lexing error could make more sense in context.
*/
const processErrorTerm = (d) => {
    // TODO: Get rightmost terminal of the term
    // Append this terminal to the error token
    return {
        type: 'error',
        value: d[1].value,
        loc: (-1, -1)
    };
}

%}

@lexer lexer

main            -> _ Statement _                                {% processMain %}

Statement       -> Expression                                   {% id %}
                 | Expression _ %DArr _ Expression              {% processStatement %}
                 | Expression _ %SArr _ Expression              {% processStatement %}

Expression      -> Term                                         {% id %}
                 | Term _ %Plus _ Expression                    {% processExpression %}

Term            -> OptCoeff Ion OptState                        {% processTerm %}
                 | OptCoeff Compound _ %Water OptState          {% processHydrateTerm %}
                 | OptCoeff %Electron                           {% processElectronTerm %}

Ion             -> Molecule                                     {% id %}
                 | Molecule Charge                              {% processIon %}
                 | Molecule Charge Ion                          {% processIonChain %}

Molecule        -> Element                                      {% id %}
                 | Compound                                     {% id %}

Compound        -> Bracket                                      {% id %}
                 | Bracket RemComp                              {% processCompound %}
                 | Element RemComp                              {% processCompound %}

RemComp         -> Element                                      {% id %}
                 | Bracket                                      {% id %}
                 | Element RemComp                              {% processCompound %}
                 | Bracket RemComp                              {% processCompound %}

Bracket         -> %LParen Compound %RParen OptNum              {% processBracket %}
                 | %LSquare Compound %RSquare OptNum            {% processBracket %}

Element         -> %Element OptNum                              {% processElement %}
                 | %Element %Sub                                {% processElementSub %}

Charge          -> %Positive                                    {% function(d) { return 1; } %}
                # Without a space '+' is interpretted as positive charge
                 | %Plus                                        {% function(d) { return 1; } %}
                 | %Negative                                    {% function(d) { return -1; } %}
                 | %Charge                                      {% processCharge %}

OptCoeff        -> null                                         {% function(d) { return { numerator: 1, denominator: 1 }; } %}
                 | %Num _                                       {% processNumber %}
                 | %Frac _                                      {% processFraction %}
                 | %Num %Slash %Num _                           {% processSlash %}

OptNum          -> null                                         {% function(d) { return 1; } %}
                 | %Num                                         {% function(d) { return parseInt(d[0].text); } %}

OptState        -> null                                         {% function(d) { return null; } %}
                 | _ %State                                     {% function(d) { return d[1].value; } %}

_               -> %WS:*                                        {% function(d) { return null; } %}
