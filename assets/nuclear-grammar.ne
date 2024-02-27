@{%

const moo = require('moo');
const lexer = moo.compile({
    LB: { match: /(?:\n|\r\n)+/, lineBreaks: true },
    WS: { match: /[ \t\n\r]+/, lineBreaks: true },

    // Statement/Equation separator
    End: [';'],

    // Arrows
    Arrow: "->",

    // Mass and Atomic numbers
    Mass: /\^{(?:[1-9][0-9]*|0)}/,
    Atomic: /_{(?:-?[1-9][0-9]*|0)}/,

    // Charges
    Charge: { match: /(?:-|\^{(?:[1-9][0-9]*)?(?:\+|\-)})/, type: moo.keywords({
        Positive: "^{+}",
        Negative: ["^{-}", "-"]
    })},

    // Non-zero naturals
    Num: /[1-9][0-9]*/,

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
    Electron: /(?:e|\\electron)/,
    Positron: "\\positron",
    Neutron: "\\neutron",
    Proton: "\\proton",

    // Nop
    Nop: "{}",

    // Error (consumes characters until a match occurs again)
    Error: { match: /[^]/, lineBreaks: true },
})

/*
Process prescripts.
Prescripts are used a lot and are in a standard form
*/
const getMassAndAtomicNumber = (prescript) => {
    const regex = /\^{(?<mass>[1-9][0-9]*|0)}_{(?<atomic>-?[1-9][0-9]*|0)}/;
    // prescript comes from Prescript parser rule so already text
    const matches = prescript.match(regex);

    return [
        parseInt(matches.groups.mass),
        parseInt(matches.groups.atomic)
    ];
}

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
Process an isotope term.
A term is some isotope or particle. In this case only the isotope.
*/
const processIsotopeTerm = (d) => {
    return {
        type: 'term',
        value: d[0],
        coeff: 1,
        isParticle: false
    };
}

/*
Process an particle term.
A term is some isotope or particle. In this case only the particle.
*/
const processParticleTerm = (d) => {
    return {
        type: 'term',
        value: d[1],
        coeff: d[0],
        isParticle: true
    };
}

/*
Process an isotope.
An isotope is an element with a possible charge.
*/
const processIsotope = (d) => {
    const [mass, atomic] = getMassAndAtomicNumber(d[0]);

    return {
        type: 'isotope',
        element: d[1].text,
        charge: d[2],
        mass: mass,
        atomic: atomic,
    };
}

/*
Process a generic particle.
A particle is a set expression with prescript
*/
const processParticle = (d) => {
    const token = d[1].type;
    const [mass, atomic] = getMassAndAtomicNumber(d[0]);

    let particle = null;
    switch (token) {
        case 'Alpha':
            particle = 'alphaparticle';
            break;
        case 'Beta':
            particle = 'betaparticle';
            break;
        case 'Gamma':
            particle = 'gammaray';
            break;
        default:
            particle = token.toLowerCase();
            break;
    }

    return {
        type: 'particle',
        particle: particle,
        mass: mass,
        atomic: atomic
    };
}

/*
Process a bare gamma particle.
As it is just a EM wave this does not need prescripts
*/
const processGamma = (d) => {
    return {
        type: 'particle',
        particle: 'gammaray',
        mass: 0,
        atomic: 0
    };
}

/*
Process a syntactic sugar positron.
*/
const processPositron = (d) => {
    const [mass, atomic] = getMassAndAtomicNumber(d[0]);

    return {
        type: 'particle',
        particle: 'positron',
        mass: mass,
        atomic: atomic
    };
}

/*
Process a syntactic sugar betaparticle.
*/
const processBeta = (d) => {
    const [mass, atomic] = getMassAndAtomicNumber(d[0]);

    return {
        type: 'particle',
        particle: 'betaparticle',
        mass: mass,
        atomic: atomic
    };
}

/*
Process a syntactic sugar electron.
*/
const processElectron = (d) => {
    const [mass, atomic] = getMassAndAtomicNumber(d[0]);

    return {
        type: 'particle',
        particle: 'electron',
        mass: mass,
        atomic: atomic
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


%}

@lexer lexer

main            -> _ Statement _                                {% processMain %}

Statement       -> Expression                                   {% id %}
                 | Expression _ %Arrow _ Expression             {% processStatement %}

Expression      -> Term                                         {% id %}
                 | Term _ %Plus _ Expression                    {% processExpression %}

Term            -> Isotope                                      {% processIsotopeTerm %}
                 | OptNum Particle                              {% processParticleTerm %}

Isotope         -> Prescript %Element OptCharge                 {% processIsotope %}

Particle        -> Prescript %Alpha                             {% processParticle %}
                 | Prescript %Beta                              {% processParticle %}
                 | Prescript %Gamma                             {% processParticle %}
                 | Prescript %Neutrino                          {% processParticle %}
                 | Prescript %AntiNeutrino                      {% processParticle %}
                 | Prescript %Electron                          {% processParticle %}
                 | Prescript %Positron                          {% processParticle %}
                 | Prescript %Neutron                           {% processParticle %}
                 | Prescript %Proton                            {% processParticle %}

                 ## Syntactic sugar
                 | %Gamma                                       {% processGamma %}
                 | Prescript %Beta %Positive                    {% processPositron %}

                 # Without a space '+' is interpretted as positive charge
                 | Prescript %Beta %Plus                        {% processPositron %}
                 | Prescript %Electron %Positive                {% processPositron %}
                 | Prescript %Beta %Negative                    {% processBeta %}
                 | Prescript %Electron %Negative                {% processElectron %}

# Standardise the order so that `processIsotopeTerm` and `processParticle`s can regex the values out
Prescript       -> %Mass %Atomic                                    {% function(d) { return d[0].text + d[1].text } %}
                 | %Atomic %Mass                                    {% function(d) { return d[1].text + d[0].text } %}
                 | %Nop %Mass %Atomic                               {% function(d) { return d[1].text + d[2].text } %}
                 | %Nop %Atomic %Mass                               {% function(d) { return d[2].text + d[1].text } %}

OptCharge       -> null                                         {% function(d) { return 0; } %}
                 | %Positive                                    {% function(d) { return 1; } %}

                 # Without a space '+' is interpretted as positive charge
                 | %Plus                                        {% function(d) { return 1; } %}
                 | %Negative                                    {% function(d) { return -1; } %}
                 | %Charge                                      {% processCharge %}

OptNum          -> null                                         {% function(d) { return 1; } %}
                 | %Num                                         {% function(d) { return parseInt(d[0].text); } %}

_               -> %WS:*                                        {% function(d) { return null; } %}
