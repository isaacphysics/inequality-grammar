@{%
const greekLetterMap = { "alpha": "α", "beta": "β", "gamma": "γ", "delta": "δ", "epsilon": "ε", "varepsilon": "ε", "zeta": "ζ", "eta": "η", "theta": "θ", "iota": "ι", "kappa": "κ", "lambda": "λ", "mu": "μ", "nu": "ν", "xi": "ξ", "omicron": "ο", "pi": "π", "rho": "ρ", "sigma": "σ", "tau": "τ", "upsilon": "υ", "phi": "ϕ", "chi": "χ", "psi": "ψ", "omega": "ω", "Gamma": "Γ", "Delta": "Δ", "Theta": "Θ", "Lambda": "Λ", "Xi": "Ξ", "Pi": "Π", "Sigma": "Σ", "Upsilon": "Υ", "Phi": "Φ", "Psi": "Ψ", "Omega": "Ω" }
// See https://github.com/no-context/moo/blob/v0.5.1/moo.js#L337-L371
// and https://github.com/no-context/moo/issues/141
function keywordTransformSafe(map) {
    let reverseMap = new Map;
    let types = Object.getOwnPropertyNames(map);
    for (let i = 0; i < types.length; i++) {
        let tokenType = types[i];
        let item = map[tokenType];
        let keywordList = Array.isArray(item) ? item : [item];
        keywordList.forEach(function(keyword) {
            if (typeof keyword !== 'string') {
                throw new Error("keyword must be string (in keyword '" + tokenType + "')");
            }
            reverseMap.set(keyword, tokenType);
        })
    }
    return function(k) {
        return reverseMap.get(k);
    }
}
const moo = require("moo")
const lexer = moo.compile({
    Int: /[0-9]+/,
    IdMod: /[a-zA-Z]+_(?:prime)/,
    Id: { match: /[a-zA-Z]+(?:_[a-zA-Z0-9]+)?/, type: keywordTransformSafe({
            TrigFn: ['cos', 'sin', 'tan',
                     'cosec', 'sec', 'cot',
                     'cosh', 'sinh', 'tanh', 'cosech', 'sech', 'coth',
                     'arccos', 'arcsin', 'arctan',
                     'arccosec', 'arcsec', 'arccot',
                     'arccosh', 'arcsinh', 'arctanh', 'arccosech', 'arcsech', 'arccoth',
                     'acos', 'asin', 'atan',
                     'acosec', 'asec', 'acot',
                     'acosh', 'asinh', 'atanh', 'acosech', 'asech', 'acoth',
                    ],
            Fn: ['ln', 'abs'],
            Log: ['log'],
            Radix: ['sqrt'],
            Derivative: ['diff', 'Derivative'],
        }),
    },
    Rel: ['=', '==', '<', '<=', '>', '>='],
    PlusMinus: ['+', '-', '±', '-', '-'], // The minus signs are not all the same
    Pow: ['**', '^'],
    Mul: ['*', '×'],
    Div: ['/', '÷'],
    Lparen: '(',
    Rparen: ')',
    Comma: ',',
    c: /./,
})

import _cloneDeep from 'lodash/cloneDeep'
import _isEmpty from 'lodash/isEmpty'
import _isEqual from 'lodash/isEqual'
import _map from 'lodash/map'
import _omit from 'lodash/omit'
import _reduceRight from 'lodash/reduceRight'

import { _simplify, _findRightmost, _rightChainToArray } from '../src/utils'

let _window = null
try {
    _window = window
} catch (error) {
    _window = { innerWidth: 800, innerHeight: 600 }
}

/* Main point of entry. This function sets up the outer shell of the
   Inequality AST with placeholder data that will then be properly filled in
   by Inequality's headless parser.

   The `_simplify()`` function avoids unnecessarily nested parentheses.
 */
const processMain = (d) => {
    let main = _cloneDeep(d[1])
    main.position = { x: _window.innerWidth/4, y: _window.innerHeight/3 }
    main.expression = { latex: "", python: "" }
    return _simplify(main)
}

/* This is an alternative main point of entry for when we want to parse
   expressions that contain two sides joined by a relation symbol, such as
   equalities and inequalities.

   This one also sets up the outer shell of the Inequality AST because it
   operates at the same level as `processMain()`, so it has to perform a
   similar job.
 */
const processRelation = (d) => {
    let lhs = _cloneDeep(d[1])
    let rhs = _cloneDeep(d[5])
    let relText = d[3].text === '==' ? '=' : d[3].text
    let relation = { type: 'Relation', properties: { relation: relText }, children: { right: rhs } }
    let r = _findRightmost(lhs)
    r.children['right'] = relation
    lhs = _simplify(lhs)
    return { ...lhs, position: { x: _window.innerWidth/4, y: _window.innerHeight/3 }, expression: { latex: "", python: "" } }
}

/* Processes round brackets. For simplicity, we only support round brackets
   here. The only job of this function is to enclose its parsed argument in
   a round Brackets object. Any nested brackets are taken care of elsewhere.
 */
const processBrackets = (d) => {
    let arg = _cloneDeep(d[2])
    return { type: 'Brackets', properties: { type: 'round' }, children: { argument: arg } }
}

/* Processes functions. There are multiple types of functions – see the lexer
   and grammar for a comprehensive list.

   This function deals with two special cases. First, the `abs()` function is
   its own special object in the Inequality AST. Second, the natural logarithm
   function (`ln`) should not allow a subscript, which could be interpreted as a
   base, thus generating confusion.

   Regular functions do not show inner superscripts like the trigonometric
   functions, e.g., `sqrt(x)^2` vs `sin^2(x)`. We parse both `sin^2(x)` and
   `sin(x)^2` in the same way, whereas `ln^2(x)` triggers a syntax error.

   It would be nice to split the two code paths (abs vs any other) but this
   isn't such a big deal for the moment.
 */
const processFunction = (d) => {
    let arg = _cloneDeep(d[3])
    // FIXME Split this into two functions and separate parsing rules.
    if (d[0].text === 'abs') {
        return { type: 'AbsoluteValue', children: { argument: arg } }
    } else {
        return { type: 'Fn', properties: { name: d[0].text, allowSubscript: d[0].text !== 'ln', innerSuperscript: false }, children: { argument: arg } }
    }
}

/* Processes trigonometric functions. These are fun because they include
   inverses in the a- and arc- forms – i.e., atan, arcsin... – which
   Inequality only shows using the ^-1 notation, and so the name has to be
   cleaned out and a -1 Num superscript is added.

   Trigonometric functions show a superscript between the name and the argument.
   This is fine because Inequality deals with this automatically when the
   `innerSuperscript` property is set to true.
 */
const processSpecialTrigFunction = (d_name, d_arg, d_exp = null) => {
    // First, deal with the shortened a- form of arc- functions.
    let r = new RegExp('^(?:a|arc)([^r].+)$')
    let name = d_name.text
    let arc = false
    if (r.test(name)) {
        name = r.exec(name)[1]
        arc = 1
    }
    // Then do everything else as normal.
    let arg = _cloneDeep(d_arg)
    let exp = _cloneDeep(d_exp)
    let sym;
    if (null === exp) {
        sym = { type: 'Fn', properties: { name: name, allowSubscript: false, innerSuperscript: true }, children: { argument: arg } }
    } else {
        sym = { type: 'Fn', properties: { name: name, allowSubscript: false, innerSuperscript: true }, children: { superscript: exp, argument: arg } }
    }
    // If this was an inverse trig function, add a -1 exponent.
    // FIXME: When parsing an inverse trig function that already has an
    //        exponent, the exponent it nuked.
    //      - Possible solution: take any exponent, multiply it by -1, and add
    //        the appropriate result to the superscript docking point.
    //      - Workaround: surround the function with brackets: (arctan(x))^2.
    if (arc) {
        sym.children.superscript = { type: 'Num', properties: { significand: '-1' }, children: {} }
    }
    return sym
}

/* Processes non-natural logarithms. These logarithms default to base 10 but
   a different base can be specified as a second argument to the function.
   E.g., `log(x, 2)` creates a base 2 logarithm.
   
   There is also limited support for symbols are bases, so `log(x, alpha_0)` is
   the logarithm of x in base \alpha_0. Expressions more complex than this are
   not allowed.
 */
const processLog = (arg, base = null) => {
    let log = { type: 'Fn', properties: { name: 'log', allowSubscript: true, innerSuperscript: false }, children: { argument: arg } }
    if (null !== base) {
        if (base.type === 'Num' || base.type === 'Symbol') {
            log.children['subscript'] = _cloneDeep(base)
        }
    } else {
        // Treat log(x) as base 10 and make this very clear to the user.
        log.children['subscript'] = { type: 'Num', properties: { significand: '10' }, children: {} }
    }
    return log
}

/* Processes radices. This is basically the `sqrt(x)` syntax which is
   technically only a square root. The only way to express other exponents is
   to use the drag-and-drop editor, or to use fractional exponents which do not
   get turned into a radix anyway – `x^(1/3)` is just `x` to the power of 1/3.
 */
const processRadix = (d) => {
    let arg = _cloneDeep(d[3])
    return { type: 'Radix', children: { argument: arg } }
}

/* Processes exponents. This function surrounds logarithms in brackets before
   adding the exponent so that it is clear that we are not raising the argument
   instead. This is not necessary for any of the other supported functions, but
   it may become necessary in the future in case any other functions will come
   in and bring potential confusion with them.
 */
const processExponent = (d) => {
    let f = _cloneDeep(d[0])
    let e = _cloneDeep(d[4])
    let r = _findRightmost(f)

    if (e.type === 'BinaryOperation') {
        const exponentRight = _cloneDeep(e.children.right.children.right)
        if (exponentRight) {
            f.children.right = exponentRight
            e.children.right.children = _omit(e.children.right.children, 'right')
        }
    } else {
        const exponentRight = _cloneDeep(e.children.right)
        if (exponentRight) {
            r.children.right = exponentRight
            e.children = _omit(e.children, 'right')
        }
    }

    if (['Fn', 'Log', 'TrigFn'].indexOf(f.type) > -1) {
        switch (f.properties.name) {
            case 'ln':
                return { type: 'Brackets', properties: { type: 'round' }, children: { argument: f, superscript: e } }
            case 'log':
                return { type: 'Brackets', properties: { type: 'round' }, children: { argument: f, superscript: e } }
            default:
                r.children['superscript'] = e
                return f
        }
    } else {
        r.children['superscript'] = e
        return f
    }
}

/* Processes multiplication.
   Yep, that's it.
 */
const processMultiplication = (d) => {
    let lhs = _cloneDeep(d[0])
    let rhs = _cloneDeep(d[d.length-1])
    let r = _findRightmost(lhs)
    r.children['right'] = rhs
    return lhs
}

/* Processes fractions. Fractions are a bit of a mess because they allow any
   expression as numerator and denominator, they can have a negative sign that
   is either typed before the a fraction enclosed in brackets – `-(x/3)` – or as
   part of the numerator – `-x/3` – and the syntax can be extremely free,
   leading to ambiguities that this function tries to resolve as much as
   possible while keeping it as simple as feasible.
 */
const processFraction = (d) => {
    let denominatorRight = null
    if (d[4].type === 'BinaryOperation') {
        // This case tries to resolve the 1/2-3 ambiguity and makes it into (1/2)-3. If you need 1/(2-3) just say so.
        denominatorRight = _cloneDeep(d[4].children.right.children.right)
        d[4].children.right.children = _omit(d[4].children.right.children, 'right')
    } else {
        denominatorRight = _cloneDeep(d[4].children.right)
        d[4].children = _omit(d[4].children, 'right')
    }
    let numerator = _cloneDeep(d[0])
    // TODO Try to remember what this does...
    let numeratorChain = _rightChainToArray(numerator).map(e => { e.children = _omit(e.children, 'right'); return e })
    let numeratorRight = numeratorChain.pop()

    let fraction = { type: 'Fraction', children: { numerator: numeratorRight, denominator: _cloneDeep(d[4]) } }
    if (denominatorRight) {
        fraction.children.right = denominatorRight
    }

    if (numeratorChain.length > 0) {
        numeratorChain[numeratorChain.length-1].children.right = fraction
        return numeratorChain.reduceRight((a, e) => { e.children.right = a; return e })
    } else {
        return fraction
    }
}

/* Process additions and subtractions.
   Easy.
 */
const processPlusMinus = (d) => {
    let lhs = _cloneDeep(d[0])
    let rhs = _cloneDeep(d[4])
    let r = _findRightmost(lhs)
    r.children['right'] = { type: 'BinaryOperation', properties: { operation: d[2].text }, children: { right: rhs } }
    return lhs
}

/* Process unary versions of binary operations – i.e., when you start your
   expression with a + or - sign.

   It may seem counterintuitive to use a BinaryOperation here but remember that
   the Inequality AST is a left-to-right tree so it doesn't matter that there
   may be nothing to the left of a BinaryOperation.
 */
const processUnaryPlusMinus = (d) => {
    return { type: 'BinaryOperation', properties: { operation: d[0].text }, children: { right: d[2] } }
}

/* Takes any sequence of letters that isn't a supported symbol and multiplies
   them together, doing the right thing if it encounters numbers. Examples:
   - abcde = a*b*c*d*e
   - 4xy = 4*x*y
   - ab543cd = a*b*543*c*d
 */
const _processChainOfLetters = (s) => {
    let symbols = _map(s.split(''), (letter) => {
        if (/[0-9]/.test(letter)) {
            return processNumber( [ {text:letter} ] )
        } else {
            return { type: 'Symbol', properties: { letter }, children: {} }
        }
    })
    let chain = _reduceRight(symbols, (a, c) => {
        c.children['right'] = a
        return c
    })
    return chain
}

/* An "identifier" is essentially a letter, unless it isn't like in the case
   of differentials.

   This function is mainly responsible for parsing things like `x`, `x_0`,
   `x_y`, `alpha_1`, and so on, but `dx` is a differential, so if you want `d*x`
   you have to say so explicitly. `d(x)` also generates `d*(x)` so be careful.
 */
const processIdentifier = (d) => {
    const greekLetterKeys = Object.keys(greekLetterMap)
    let parts = d[0].text.split('_')

    // Perhaps we have a differential
    let patterns = ['[a-zA-Z]', ...greekLetterKeys].join('|')
    const diffMatcher = new RegExp(`^((?:d|D)(?:elta)?)(${patterns})$`)
    const diffMaybe = parts[0].match(diffMatcher)
    if (diffMaybe) {
        // We do have a differential
        return {
            type: 'Differential',
            properties: { letter: greekLetterMap[diffMaybe[1]] || diffMaybe[1] },
            children: { argument: processIdentifier([{ text: d[0].text.substring(diffMaybe[1].length) }]) }
        }
    } else {
        // We don't have a differential, business as usual
        if (greekLetterKeys.indexOf(parts[0]) > -1) {
            parts[0] = greekLetterMap[parts[0]]
        }
        let topChain = _processChainOfLetters(parts[0])
        if (parts.length > 1) {
            if (greekLetterKeys.indexOf(parts[1]) > -1) {
                parts[1] = greekLetterMap[parts[1]]
            }
            let chain = _processChainOfLetters(parts[1])
            let r = _findRightmost(topChain)
            r.children['subscript'] = chain
        }
        return topChain
    }
}

/* Processes "modified" Symbols. For example, `alpha_prime` generates a Symbol
   that specifies a `'` modifier.
 */
const processIdentifierModified = (d) => {
    const greekLetterKeys = Object.keys(greekLetterMap)
    let parts = d[0].text.split('_')
    if (greekLetterKeys.indexOf(parts[0]) > -1) {
        parts[0] = greekLetterMap[parts[0]]
    }
    let topChain = _processChainOfLetters(parts[0])
    let r = _findRightmost(topChain)
    r.properties['modifier'] = parts[1]
    return topChain
}

/* Processes numbers. We have all the integers: we have positive integers,
   we have negative integers, we even have zero, but none of that rational
   nonsense!
   
   Because we have fractions for that. We are not savages...
 */
const processNumber = (d) => {
    return { type: 'Num', properties: { significand: d[0].text }, children: {} }
}

/* Processes derivatives.
   This may look like a complicated function but the complication really only
   originates from the order calculations.

   The basic syntax is somewhat similar to SymPy's `diff` function. We take
   the experssion to be derived as the first parameter, and the differentials
   as any number of subsequent parameters.

   Differentials can be specified as a sequence of variable and order, or as
   any repetition of the variable that corresponds to the desired order.
   For example, `Derivative(f(x), y, 2, t, t, t)` corresponds to deriving `f(x)`
   in `y` twice and `t` three times.

   If that makes any sense.
 */
const processDerivative = (d) => {
    let numerator = {
        type: 'Differential',
        properties: { letter: 'd' },
        children: {
            argument: d[3]
        }
    }
    let denList = d[7].reduce((a, e) => {
        if (a.length == 0) {
            return [{ object: e, order: 1 }]
        } else {
            let last = a[a.length-1]
            if (e.type === 'Num') {
                last.order = parseInt(e.properties.significand)
                return [...a.slice(0, a.length-1), last]
            } else if (_isEqual(e, last.object)) {
                last.order = last.order + 1
                return [...a.slice(0, a.length-1), last]
            } else {
                return [...a, { object: e, order: 1 }]
            }
        }
    }, []).map(e => {
        let differential = {
            type: 'Differential',
            properties: { letter: 'd' },
            children: {
                argument: e.object
            }
        }
        if (e.order > 1) {
            differential.children['order'] = {
                type: 'Num',
                properties: { significand: `${e.order}` },
                children: {}
            }
        }
        return differential
    })
    let order = denList.reduce( (a, e) => a + (parseInt(e.children.order ? e.children.order.properties.significand : "1")), 0)
    if (order > 1) {
        numerator.children['order'] = {
            type: 'Num',
            properties: { significand: `${order}` },
            children: {}
        }
    }
    let denominator = _reduceRight(denList, (a, c) => {
        c.children['right'] = a
        return c
    })
    return {
        type: 'Derivative',
        children: {
            numerator,
            denominator
        }
    }
}
%}

@lexer lexer

### Behold, the Grammar!

main -> _ AS _                                                         {% processMain %}
      | _ AS _ %Rel _ AS _                                             {% processRelation %}

P ->                   %Lparen _ AS _                 %Rparen          {% processBrackets %}
   | %TrigFn           %Lparen _ AS _                 %Rparen          {% d => processSpecialTrigFunction(d[0], d[3], null) %}
   | %TrigFn %Pow NUM  %Lparen _ AS _                 %Rparen          {% d => processSpecialTrigFunction(d[0], d[5], d[2]) %}
   | %TrigFn           %Lparen _ AS _                 %Rparen %Pow NUM {% d => processSpecialTrigFunction(d[0], d[3], d[7]) %}
   | %Derivative       %Lparen _ AS _ %Comma _ ARGS _ %Rparen          {% processDerivative %}
   | %Log              %Lparen _ AS _                 %Rparen          {% (d) => { return processLog(d[3]) } %}
   | %Log              %Lparen _ AS _ %Comma _ VAR _  %Rparen          {% (d) => { return processLog(d[3], d[7]) } %}
   | %Log              %Lparen _ AS _ %Comma _ NUM _  %Rparen          {% (d) => { return processLog(d[3], d[7]) } %}
   | %Radix            %Lparen _ AS _                 %Rparen          {% processRadix %}
   | %Fn               %Lparen _ AS _                 %Rparen          {% processFunction %}
   | VAR                                                               {% id %}
   | NUM                                                               {% id %}
   | %PlusMinus _ P                                                    {% processUnaryPlusMinus %}

ARGS -> AS                                                             {% (d) => [d[0]] %}
      | ARGS _ %Comma _ AS                                             {% (d) => d[0].concat(d[4]) %}

E -> P _ %Pow _ E                                                      {% processExponent %}
   | P                                                                 {% id %}

# Multiplication and division
MD -> MD _ %Mul _ E                                                    {% processMultiplication %}
    | MD _ %Div _ E                                                    {% processFraction %}
    | MD _ E                                                           {% processMultiplication %}
    | E                                                                {% id %}

AS -> AS _ %PlusMinus _ MD                                             {% processPlusMinus %}
    | MD                                                               {% id %}

VAR -> %Id                                                             {% processIdentifier %}
     | %IdMod                                                          {% processIdentifierModified %}

NUM -> %Int                                                            {% processNumber %}

_ -> [\s]:*
