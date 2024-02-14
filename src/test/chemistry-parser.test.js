import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
import grammar from '../../assets/chemistry-grammar.ne'

const compiledGrammar = Grammar.fromCompiled(grammar)

const parse = (expression = '') => {
    const parser = new Parser(compiledGrammar)
    let output = null
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error) {
        return { result: { type: 'error', value: error } };
    }
    return output
}

describe("Parser captures lexing errors", () => {
    it("Returns 'error' object when parsing an error",
        () => {
            // Act
            const AST = parse("C!C");
            // The first node should be a 'C!' error
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('C!');
        }
    );
});

describe("Parser correctly parses elements", () => {
    it("Returns an 'element' object when given a standalone element",
        () => {
            // Act
            const AST = parse('C');
            const element = AST.result;

            // Assert
            expect(element.type).toBe('element');
            expect(element.value).toBe('C');
        }
    );
    it("Returns an 'element' object with number when provided",
        () => {
            // Act
            const tests = ['H2', 'O_{3}'];
            const values = ['H', 'O'];
            const numbers = [2, 3];
            const elements = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    elements[index] = AST.result
                }
            )

            // Assert
            elements.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('element');
                    expect(item.value).toBe(values[index]);
                    expect(item.number).toBe(numbers[index]);
                }
            )
        }
    );
    it("Returns an 'error' object when invalid element provide",
        () => {
            // Act
            const AST = parse('Hz');
            const error = AST.result;
            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('Hz');
        }
    );
});

describe("Parser correctly parses brackets", () => {
    it("Returns an 'bracket' object when given either bracketting",
        () => {
            // Act
            const tests = ['(CO2)', '[CO2]'];
            const brackets = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item);
                    brackets.push(AST.result)
                }
            )

            // Assert
            brackets.forEach(
                function(item, _index, _arr) {
                    expect(item.type).toBe('bracket');
                    // Mutually recursive so can't test value as it may fail on 'compound'
                    // Can check the type works
                    expect(['compound', 'bracket']).toContain(item.compound.type);
                }
            )
        }
    );
    it("Returns a 'bracket' object when given bracketing with numbers",
        () => {
            // Act
            const tests = ['(CH2)4', '[CH2]320'];
            const numbers = [4, 320];
            const brackets = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    brackets[index] = AST.result;
                }
            );
            // Assert
            brackets.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('bracket');
                    expect(item.number).toBe(numbers[index]);
                    // Mutually recursive so can't test value as it may fail on 'compound'
                    // Can check the type works
                    expect(['compound', 'bracket']).toContain(item.compound.type);
                }
            );
        }
    );
    it("Returns an 'error' object when brackets are empty or contain elements",
        () => {
            // Act
            const tests = ['()', '[]', '(C)', '[C]'];
            const errors = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item);
                    errors.push(AST.result);
                }
            );
            // Assert
            errors.forEach(
                function(item, _index, _arr) {
                    expect(item.type).toBe('error');
                }
            )
        }
    );
});

describe("Parser correctly parses compounds", () => {
    it("Returns a 'compound' when given element and bracketted compounds",
        () => {
            // Act
            const tests = ['CO2', 'CH3[CH2]4CH3', '(HO)2[CO]3'];
            const heads = [parse('C').result, parse('C').result, parse('(HO).result2')];
            const tails = [parse('O2').result, parse('H3[CH2]4CH3').result, parse('[CO]3').result]
            const compounds = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    compounds[index] = AST.result;
                }
            );

            // Assert
            compounds.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('compound');
                    // The compound is stored as a cons-list 
                    // TODO: check whether javascript list is better
                    expect(item.head).toEqual(heads[index]);
                    expect(item.tail).toEqual(tails[index]);
                }
            )
        }
    );
    it("Returns an 'error' object when given a single element",
        () => {
            // Act
            // A single element will be parsed as such
            // Brackets must contain
            const AST = parse('[C]');
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('[C]');
        }
    );
});

// The 'molecule' rule is just a syntactic sugar in the parser
// If element or molecule pass/fail then molecule does the same

describe("Parser correctly parses ions", () => {
    it("Returns a 'ion' when provided with a charge",
        () => {
            // Act
            const tests = ['Na\^{+}', 'Cl-', 'Cl\^{-}'];
            const charges = ['pos', 'neg', 'neg'];
            const molecules = [parse('Na'), parse('Cl'), parse('Cl')]
            const ions = [];
            tests.forEach(
                function(item, index, _arr){
                    const AST = parse(item);
                    ions[index] = AST.result;
                }
            )
            // Assert
            ions.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('ion');
                    expect(item.charge).toBe(charges[index]);
                    expect(item.molecule).toEqual(molecules[index]);
                }
            )
        }
    );
    it("Returns an 'ion' object when provided with an ion chain",
        () => {
            // Act
            const AST = parse('Na\^{+}Cl-F\^{-}P\^{+}');
            const ion = AST.result;
            // Assert
            expect(ion.type).toBe('ion');
            expect(ion.charge).toBe('pos');
            // Stored as a cons-list
            // TODO: check if this property is required and if lists are better
            expect(ion.molecule).toEqual(parse('Na'));
            expect(ion.chain).toBeDefined();
            expect(ion.molecule).toEqual(parse('Cl-F\^{-}P\^{+}'));
        }
    );
    it("Returns an 'error' object when provided with an incorrect charge",
        () => {
            // Act
            const tests = ['Na+', 'Cl--', 'Na\^{+}\^{+}', 'Cl\^{-}\^{-}'];
            const errors = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item);
                    errors.push(AST.result);
                }
            )

            // Assert
            errors.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('error');
                    expect(item.value).toBe(tests[index]);
                }
            )
        }
    );
});

describe("Parser correctly parses terms", () => {
    it("Returns a 'term' when given an electron",
        () => {
            // Act
            const tests = ['e\^{-}', '\\electron\^{-}'];
            const terms = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item);
                    terms.push(AST.result);
                }
            )

            // Assert
            terms.forEach(
                function(item, _index, _arr) {
                    expect(item.type).toBe('term');
                    expect(item.isElectron).toBeTruthy();
                }
            )
        }
    );
    it("Returns a 'term' when given a hydrous crystal",
        () => {
            // Act
            const AST = parse('MgSO4 . 7H2O');
            const term = AST.result;

            // Assert
            expect(term.type).toBe('term');
            expect(term.isHydrate).toBeTruthy();
            expect(term.hydrate).toBe(7);
        }
    );
    it("Returns a 'term' when given a coefficient",
        () => {
            // Act
            const tests = ['2e\^{-}', '100Na\^{+}', '99NaCl . 6H2O'];
            const coeffs = [2, 100, 99];
            const ASTs = [{}, parse('Na\^{+}').result, parse('NaCl . 6H2O').result];
            const terms = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    terms[index] = AST.result;
                }
            )
            // Assert
            terms.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('term');
                    expect(item.coeff).toBe(coeffs[index]);
                    if (!item.isElectron) {
                        expect(item.value).toEqual(ASTs[index]);
                    }
                }
            )
        }
    );
    it("Returns a 'term' when given a state (when applicable)",
        () => {
            // Act
            const tests = ['Mg (g)', '7NaCl (aq)', 'MgSO4 . 7H2O (s)'];
            const ASTs = [parse('Mg').result, parse('NaCl').result, parse('MgSO4').result];
            const states = ['(g)', '(aq)', '(s)'];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    terms[index] = AST.result;
                }
            )
            // Assert
            terms.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('term');
                    expect(item.state).toBe(states[index]);
                    expect(item.value).toEqual(ASTs[index]);
                }
            );
        }
    );
    it("Returns an 'error' when an electron has state",
        () => {
            // Act
            const AST = parse('e\^{-} (s)');
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('e\^{-} (s)');
        }
    );
    it("Returns an 'error' when multiple states or coeffs are given",
        () => {
            // Act
            const tests = ['10 11O2', 'O2 (g) (s)'];
            const errors = []
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item);
                    errors.push(AST.result);
                }
            )
            // Assert
            errors.forEach(
                function(item, _index, _arr) {
                    expect(item.type).toBe('error');
                }
            )
        }
    );
});

describe("Parser correctly parses expressions", () => {
    it("Returns term and expression when provided with an '+'",
        () => {
            // Act
            const AST = parse('C+C+C');
            const expr = AST.result;

            // Assert
            expect(expr.term.type).toBe('term');
            expect(expr.rest.type).toBe('expr');
            expect(expr.rest.term.type).toBe('term'); // a cons-list
        }
    );
    it("Returns error when provided with 'term term'",
        () => {
            // Act
            const AST = parse('C C');
            const error = AST.result;
            // Assert
            expect(error.type).toBe('error');
        }
    );
});

describe("Parser correctly parses statements", () => {
    it("Returns left and right expressions when provided with an arrow",
        () => {
            // Act
            const statements = [];
            const arrow = ['DArr', 'SArr'];
            ['C->C', 'C<=>C'].forEach(
                function(item, _index, _arr) {
                    const AST = parse(item);
                    statements.push(AST.result)
                }
            )

            // Assert
            statements.forEach(
                function(item, index, _arr) {
                    expect(item.left).toBeDefined();
                    expect(item.right).toBeDefined();
                    expect(item.arrow).toBeDefined();
                    expect(item.arrow).toBe(arrow[index]);
                }
            )
        }
    );
    it("Returns error when provided with 'expr expr'",
        () => {
            // Act
            const AST = parse('C C');
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
        }
    );
});
