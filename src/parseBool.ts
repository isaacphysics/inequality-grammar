import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
//@ts-ignore
import grammar from '../assets/boolean-grammar.ne'
import { InequalityWidget, ParsingError2 } from './types'

const compiledGrammar = Grammar.fromCompiled(grammar)

export default function(expression: string = ''): InequalityWidget[] | ParsingError2 {
    const parser = new Parser(compiledGrammar)
    let output;
    try {
        output = _uniqWith(parser.feed(expression).results as InequalityWidget[], _isEqual)
    } catch (error: any) {
        console.log(error);
        return { error }
    }
    return output
}
