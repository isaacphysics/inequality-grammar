import _uniqWith from 'lodash/uniqWith';
import _isEqual from 'lodash/isEqual';

import { Parser, Grammar } from 'nearley';
//@ts-ignore
import grammar from '../assets/nuclear-grammar.ne';
import { NuclearAST, ParsingError2 } from './types';

const compiledGrammar = Grammar.fromCompiled(grammar)

export function parseNuclearExpression(expression: string = ''): NuclearAST[] | ParsingError2 {
    const parser = new Parser(compiledGrammar);
    let output: NuclearAST[];
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error: any) {
        if (error.name === 'Error') {
            const token = error.token

            return {
                type: 'error',
                value: token.value,
                loc: [token.line, token.col],    
            }
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
