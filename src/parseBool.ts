import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
//@ts-ignore
import grammar from '../assets/boolean-grammar.ne'
import { InequalityWidget, ParsingError } from './types'

const compiledGrammar = Grammar.fromCompiled(grammar)

export function parseBooleanExpression(expression: string = ''): InequalityWidget[] | ParsingError {
    const parser = new Parser(compiledGrammar)
    let output;
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error: any) {
        if (error.name === 'Error') {
            const token = error.token

            return {
                error: {
                    offset: token.offset -1,
                    token: { value: token.value }
                },
                message: `Unexpected token ${token.value}`,
                stack: ""
            }
        } else {
            console.log(error.message);
            return {
                error: {
                    offset: -1,
                    token: { value: error.message }
                },
                message: error.message,
                stack: ""
            }
        }
    }
    return output
}
