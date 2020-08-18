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
    let main = _cloneDeep(d[1])
    main.position = { x: _window.innerWidth/4, y: _window.innerHeight/3 }
    main.expression = { latex: "", python: "" }
    return _simplify(main)
}

const processBrackets = (d) => {
    let arg = d[2] //_cloneDeep(d[2])
    return { type: 'Brackets', properties: { type: 'round' }, children: { argument: arg } }
}

const processBinaryOperation = (d, operation) => {
    let lhs = _cloneDeep(d[0])
    let rhs = _cloneDeep(d[d.length-1])
    let r = _findRightmost(lhs)
    r.children['right'] = { type: 'LogicBinaryOperation', properties: { operation: d[2].toLowerCase() }, children: { right: rhs } }
    return lhs
}

const processNot = (d) => {
    return { type: 'LogicNot', children: { argument: d[2] } }
}


%}

main -> _ AS _              {% processMain %}

# OR
AS -> AS _ "OR" _ MD        {% processBinaryOperation %}
AS -> AS _ "or" _ MD        {% processBinaryOperation %}
AS -> AS _  "|" _ MD        {% processBinaryOperation %}
    | MD                    {% id %}

# AND
MD -> MD _ "AND" _ XOR      {% processBinaryOperation %}
MD -> MD _ "and" _ XOR      {% processBinaryOperation %}
MD -> MD _  "&"  _ XOR      {% processBinaryOperation %}
    | XOR                   {% id %}

# XOR
XOR -> XOR _ "XOR" _ P      {% processBinaryOperation %}
     | XOR _ "xor" _ P      {% processBinaryOperation %}
     | XOR _  "^"  _ P      {% processBinaryOperation %}
     | P                    {% id %}

# Parentheses
P -> "(" _ AS _ ")"         {% processBrackets %}
   | N                     {% id %}

# NOT
N -> "NOT" _ P              {% processNot %}
N ->  "!"  _ P              {% processNot %}
   | L                      {% id %}

# Literals are literal true and false plus (single capital) letters
L -> "true"           {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "True"           {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "T"              {% (d) => ({ type: 'LogicLiteral', properties: { value: true }, children: {} }) %}
   | "false"          {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | "False"          {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | "F"              {% (d) => ({ type: 'LogicLiteral', properties: { value: false }, children: {} }) %}
   | [A-EG-SU-Z]	  {% (d) => ({ type: 'Symbol', properties: { letter: d[0] }, children: {} }) %}


# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_ -> [\s]:*     {% function(d) {return null } %}
