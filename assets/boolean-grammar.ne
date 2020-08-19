@{%

import _cloneDeep from 'lodash/cloneDeep'
import _isEmpty from 'lodash/isEmpty'
import _isEqual from 'lodash/isEqual'
import _map from 'lodash/map'
import _mapValues from 'lodash/mapValues'
import _omit from 'lodash/omit'
import _reduceRight from 'lodash/reduceRight'

import { _simplify, _findRightmost } from '../src/utils'

let _window = null
try {
    _window = window
} catch (error) {
    _window = { innerWidth: 800, innerHeight: 600 }
}

const processMain = (d) => {
    const main = _cloneDeep(d[1])
    main.position = { x: _window.innerWidth/4, y: _window.innerHeight/3 }
    main.expression = { latex: "", python: "" }
    return _simplify(main)
}

const processBrackets = (d) => {
    const arg = d[2] //_cloneDeep(d[2])
    return { type: 'Brackets', properties: { type: 'round' }, children: { argument: arg } }
}

const processBinaryOperation = (d) => {
    const lhs = _cloneDeep(d[0])
    const rhs = _cloneDeep(d[d.length-1])
    const r = _findRightmost(lhs)
    let operation = '';
    switch(d[2].toLowerCase()) {
        case 'AND':
        case 'and':
        case '&':
        case '∧':
        case '.':
            operation = 'and'
            break
        case 'OR':
        case 'or':
        case '|':
        case '∨':
        case 'v':
        case '+':
            operation = 'or'
            break
        case 'XOR':
        case 'xor':
        case '^':
        case '⊻':
            operation = 'xor'
            break
        default:
            operation = ''
    }
    r.children['right'] = { type: 'LogicBinaryOperation', properties: { operation }, children: { right: rhs } }
    return lhs
}

const processNot = (d) => {
    return { type: 'LogicNot', children: { argument: d[2] } }
}


%}

main -> _ AS _              {% processMain %}

# OR
AS -> AS _ "OR" _ MD        {% processBinaryOperation %}
    | AS _ "or" _ MD        {% processBinaryOperation %}
    | AS _  "|" _ MD        {% processBinaryOperation %}
    | AS _  "∨" _ MD        {% processBinaryOperation %}
    | AS _  "v" _ MD        {% processBinaryOperation %}
    | AS _  "+" _ MD        {% processBinaryOperation %}
    | MD                    {% id %}

# AND
MD -> MD _ "AND" _ XOR      {% processBinaryOperation %}
    | MD _ "and" _ XOR      {% processBinaryOperation %}
    | MD _  "&"  _ XOR      {% processBinaryOperation %}
    | MD _  "∧"  _ XOR      {% processBinaryOperation %}
    | MD _  "."  _ XOR      {% processBinaryOperation %}
    | XOR                   {% id %}

# XOR
XOR -> XOR _ "XOR" _ P      {% processBinaryOperation %}
     | XOR _ "xor" _ P      {% processBinaryOperation %}
     | XOR _  "^"  _ P      {% processBinaryOperation %}
     | XOR _  "⊻"  _ P      {% processBinaryOperation %}
     | P                    {% id %}

# Parentheses
P -> "(" _ AS _ ")"         {% processBrackets %}
   | N                      {% id %}

# NOT
N -> "NOT" _ P              {% processNot %}
   |  "!"  _ P              {% processNot %}
   |  "~"  _ P              {% processNot %}
   |  "¬"  _ P              {% processNot %}
   | L                      {% id %}

# Literals are literal true and false plus (single capital) letters
L -> "true"           {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "True"           {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "T"              {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "1"              {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "false"          {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | "False"          {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | "F"              {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | "0"              {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | [A-EG-SU-Z]	  {% (d) => ({ type: 'Symbol', properties: { letter: d[0] }, children: {} }) %}


# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_ -> [\s]:*     {% function(d) {return null } %}
