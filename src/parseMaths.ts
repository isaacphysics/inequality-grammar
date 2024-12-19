import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
//@ts-ignore
import grammar from '../assets/maths-grammar.ne'
import { InequalityWidget, ParsingError3 } from './types'

const compiledGrammar = Grammar.fromCompiled(grammar)

export default function(expression: string = ''): InequalityWidget[] | ParsingError3 {
    const parser = new Parser(compiledGrammar)
    let output;
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error) {
        console.log(error);
        output = { error }
    }
    return output
}
