import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
import grammar from '../assets/chemistry-grammar.ne'

const compiledGrammar = Grammar.fromCompiled(grammar)

const parseChemistryExpression = (expression = '') => {
    const parser = new Parser(compiledGrammar)
    let output = null
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error) {
        if (error.name === 'Error') {
            const token = error.token
            const expected_tokens = error.message.match(/(?<=A ).*(?= based on:)/g)
            const expected = expected_tokens !== null ? expected_tokens.map(s => s.replace(/\s+token/i, '')) : [];

            return [{
                result: {
                    type: 'error',
                    value: token.value,
                    expected: [...new Set(expected)],
                    loc: (token.line, token.col)
                }
            }];
        } else {
            console.log(error.message);
            return [{
                result: {
                    type: error.name,
                    value: error.message,
                    expected: [],
                    loc: (0, 0)
                }
            }]
        }
    }
    return output
}

export default parseChemistryExpression;
