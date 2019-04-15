import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
import grammar from '../assets/grammar.ne'

const compiledGrammar = Grammar.fromCompiled(grammar)

export function parseExpression(expression = '') {
    const parser = new Parser(compiledGrammar)
    let output = null
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error) {
        output = { error }
    }
    return output
}