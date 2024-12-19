import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
//@ts-ignore
import grammar from '../assets/chemistry-grammar.ne'
import { ErrorToken, NuclearAST } from './types'

const compiledGrammar = Grammar.fromCompiled(grammar)

export function parseChemistryExpression(expression: string = ''): NuclearAST[] | ErrorToken {
    const parser = new Parser(compiledGrammar)
    let output = null
    try {
        output = _uniqWith(parser.feed(expression).results as NuclearAST[], _isEqual)
    } catch (error: any) {
        if (error.name === 'Error') {
            const token = error.token

            return {
                type: 'error',
                value: token.value,
                loc: [token.line, token.col]
            };
        } else {
            console.log(error.message);
            return {
                type: error.name,
                value: error.message,
                loc: [0, 0]
            }
        }
    }
    return output
}
