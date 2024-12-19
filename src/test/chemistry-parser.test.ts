import { parseChemistryExpression } from '../parseChem';
import { Bracket, ChemistryTerm, Compound, Element, ErrorToken, Expression, Fraction, Ion, isChemistryTerm, isErrorToken, NuclearAST, Result, Statement, Term } from '../types';

// The parse returns an array of ASTs (in case of ambiguity). The grammar is unambiguous so the array will always have one element
function parse(expression: string): Result {
    const a = parseChemistryExpression(expression);
    if (isErrorToken(a)) {
        return { type: 'error', value: '', loc: [0,0] };
    }
    return a[0].result;
}

// All nodes below Term are wrapped in a Term. This abstraction function is therefore useful for typeguarding and compactness
function parseTerm(expression: string): ChemistryTerm {
    const a = parse(expression);
    if (isChemistryTerm(a)) {
        return a;
    }
    return { type: 'term' } as ChemistryTerm;
}

describe("Parser captures lexing errors", () => {
    it("Returns 'error' object when parsing an error",
        () => {
            // Act
            const AST = parseChemistryExpression("C!C") as ErrorToken;
            // The first node should be a 'C!' error

            // Assert
            expect(AST.type).toBe('error');
            expect(AST.value).toBe('!');
        }
    );
});

describe("Parser correctly parses elements", () => {
    it("Returns an 'element' object when given a standalone element",
        () => {
            // Act
            const AST = parseTerm('C');
            const element = AST.value as Element; // Everything below a 'term' is wrapped in a 'term'

            // Assert
            expect(element.type).toBe('element');
            expect(element.value).toBe('C');
        }
    );
    it("Returns an 'element' object with number when provided",
        () => {
            // Act
            const tests: string[] = ['H2', 'O_{3}'];
            const values: string[] = ['H', 'O'];
            const numbers: number[] = [2, 3];
            const elements: Element[] = [];
            tests.forEach(
                function(item, index) {
                    const AST = parseTerm(item);
                    elements[index] = AST.value as Element;
                }
            )

            // Assert
            elements.forEach(
                function(item, index) {
                    expect(item.type).toBe('element');
                    expect(item.value).toBe(values[index]);
                    expect(item.coeff).toBe(numbers[index]);
                }
            )
        }
    );
    it("Returns an 'error' object when invalid element provide",
        () => {
            // Act
            const AST = parseChemistryExpression('Hz') as ErrorToken;
            // Assert
            expect(AST.type).toBe('error');
            expect(AST.value).toBe('z');
        }
    );
});

describe("Parser correctly parses brackets", () => {
    it("Returns an 'bracket' object when given either bracketting",
        () => {
            // Act
            const tests: string[] = ['(CO2)', '[CO2]'];
            const brackets: Bracket[] = [];
            tests.forEach(
                function(item) {
                    const AST = parseTerm(item);
                    brackets.push(AST.value as Bracket)
                }
            )

            // Assert
            brackets.forEach(
                function(item) {
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
            const tests: string[] = ['(CH2)4', '[CH2]320'];
            const numbers: number[] = [4, 320];
            const brackets: Bracket[] = [];
            tests.forEach(
                function(item, index) {
                    const AST = parseTerm(item);
                    brackets[index] = AST.value as Bracket
                }
            );
            // Assert
            brackets.forEach(
                function(item, index) {
                    expect(item.type).toBe('bracket');
                    expect(item.coeff).toBe(numbers[index]);
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
            const tests: string[] = ['()', '[]'];
            const errors: ErrorToken[] = [];
            tests.forEach(
                function(item) {
                    const AST = parseChemistryExpression(item) as ErrorToken;
                    errors.push(AST);
                }
            );
            // Assert
            errors.forEach(
                function(item) {
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
            const tests: string[] = ['CO2', 'CH3[CH2]4CH3', '(HO)2[CO]3'];
            const heads: (Element | Bracket | Compound)[] = [
                parseTerm('C').value as Element,
                parseTerm('C').value as Element,
                parseTerm('(HO)2').value as Bracket,
            ];
            const tails: (Element | Bracket | Compound)[] = [
                parseTerm('O2').value as Element,
                parseTerm('H3[CH2]4CH3').value as Compound,
                parseTerm('[CO]3').value as Bracket,
            ];
            const compounds: Compound[] = [];
            tests.forEach(
                function(item, index) {
                    const AST = parseTerm(item);
                    compounds[index] = AST.value as Compound;
                }
            );

            // Assert
            compounds.forEach(
                function(item, index) {
                    expect(item.type).toBe('compound');
                    // The compound is stored as a cons-list 
                    // TODO: check whether javascript list is better
                    expect(item.head).toEqual(heads[index]);
                    expect(item.tail).toEqual(tails[index]);
                }
            )
        }
    );
    it("Returns an 'term' object when given a single element",
        () => {
            // Act
            // A single element will be parsed as such
            // Brackets must contain
            const AST: NuclearAST = (parseChemistryExpression('[C]') as NuclearAST[])[0];
            const ASTTerm: Bracket = parseTerm('[C]').value as Bracket;
            const result = AST.result;

            // Assert
            expect(result.type).toBe('term');
            expect(ASTTerm.type).toBe('bracket');
        }
    );
});

// The 'molecule' rule is just a syntactic sugar in the parser
// If element or molecule pass/fail then molecule does the same

describe("Parser correctly parses ions", () => {
    it("Returns a 'ion' when provided with a charge",
        () => {
            // Act
            const tests: string[] = ['Na\^{+}', 'Cl-', 'Cl\^{-}', 'Fe\^{2+}', 'N\^{3-}'];
            const charges: number[] = [1, -1, -1, 2, -3];
            const molecules: Element[] = [
                parseTerm('Na').value as Element,
                parseTerm('Cl').value as Element,
                parseTerm('Cl').value as Element,
                parseTerm('Fe').value as Element,
                parseTerm('N').value as Element
            ]
            const ions: Ion[] = [];
            tests.forEach(
                function(item, index){
                    const AST = parseTerm(item);
                    ions[index] = AST.value as Ion;
                }
            )
            // Assert
            ions.forEach(
                function(item, index) {
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
            const AST = parseTerm('Na\^{+}Cl-F\^{-}P\^{+}');
            const ion: Ion = AST.value as Ion;
            // Assert
            expect(ion.type).toBe('ion');
            expect(ion.charge).toBe(1);
            // Stored as a cons-list
            // TODO: check if this property is required and if lists are better
            expect(ion.molecule).toEqual(parseTerm('Na').value);
            expect(ion.chain).toBeDefined();
            expect(ion.chain).toEqual(parseTerm('Cl-F\^{-}P\^{+}').value);
        }
    );
    it("Returns an 'error' object when provided with an incorrect charge",
        () => {
            // Act
            const tests: string[] = ['Cl--', 'Na\^{+}\^{+}', 'Cl\^{-}\^{-}'];
            const values: string[] = ['-', '\^{+}', '\^{-}'];
            const errors: ErrorToken[] = [];
            tests.forEach(
                function(item) {
                    errors.push(parseChemistryExpression(item) as ErrorToken);
                }
            )

            // Assert
            errors.forEach(
                function(item, index) {
                    expect(item.type).toBe('error');
                    expect(item.value).toBe(values[index]);
                }
            )
        }
    );
});

describe("Parser correctly parses terms", () => {
    it("Returns a 'term' when given an electron",
        () => {
            // Act
            const tests: string[] = ['e\^{-}', '\\electron\^{-}'];
            const terms: ChemistryTerm[] = [];
            tests.forEach(
                function(item) {
                    const AST = parse(item) as ChemistryTerm;
                    terms.push(AST);
                }
            )

            // Assert
            terms.forEach(
                function(item) {
                    expect(item.type).toBe('term');
                    expect(item.isElectron).toBeTruthy();
                }
            )
        }
    );
    it("Returns a 'term' when given a hydrous crystal",
        () => {
            // Act
            const ASTTerm: ChemistryTerm = parse('MgSO4 . 7H2O') as ChemistryTerm;
            const value: Compound = parseTerm('MgSO4').value as Compound; 

            // Assert
            expect(ASTTerm.type).toBe('term');
            expect(ASTTerm.isHydrate).toBeTruthy();
            expect(ASTTerm.value).toEqual(value)
            expect(ASTTerm.hydrate).toBe(7);
        }
    );
    it("Returns a 'term' when given a coefficient",
        () => {
            // Act
            const tests: string[] = ['2e\^{-}', '100Na\^{+}', '99NaCl . 6H2O'];
            const coeffs: Fraction[] = [
                { "numerator": 2, "denominator": 1 },
                { "numerator": 100, "denominator": 1 },
                { "numerator": 99, "denominator": 1 }
            ];
            const ASTs: (Element | Compound)[] = [
                {} as Element, // Electron does not have a value
                parseTerm('Na\^{+}').value as Element, 
                parseTerm('NaCl . 6H2O').value as Compound
            ];
            const terms: ChemistryTerm[] = [];
            tests.forEach(
                function(item, index) {
                    terms[index] = parse(item) as ChemistryTerm;
                }
            )
            // Assert
            terms.forEach(
                function(item, index) {
                    expect(item.type).toBe('term');
                    expect(item.coeff).toEqual(coeffs[index]);
                    if (!item.isElectron) {
                        expect(item.value).toEqual(ASTs[index]);
                    }
                }
            )
        }
    );
    it("Returns a 'term' when given fractional coefficients",
        () => {
            // Act
            const tests: string[] = ['\\frac{100}{3}Na\^{+}', '1/202e\^{-}'];
            const coeffs: Fraction[] = [
                { "numerator": 100, "denominator": 3 },
                { "numerator": 1, "denominator": 202 }
            ]
            const ASTs: Element[] = [
                parseTerm('Na\^{+}').value as Element, 
                {} as Element, // Electron does not have a value
            ];
            const terms: ChemistryTerm[] = [];
            tests.forEach(
                function(item, index) {
                    terms[index] = parse(item) as ChemistryTerm;
                }
            );

            // Assert
            terms.forEach(
                function(item, index) {
                    expect(item.type).toBe('term');
                    expect(item.coeff).toEqual(coeffs[index]);
                    if (!item.isElectron) {
                        expect(item.value).toEqual(ASTs[index]);
                    }
                }
            );
        }
    );
    it("Returns a 'term' when given a state (when applicable)",
        () => {
            // Act
            const tests: string[] = ['Mg (g)', '7NaCl (aq)', 'MgSO4 . 7H2O (s)'];
            const ASTs: (Element | Compound)[] = [
                parseTerm('Mg').value as Element,
                parseTerm('NaCl').value as Compound,
                parseTerm('MgSO4').value as Compound
            ];
            const states: string[] = ['(g)', '(aq)', '(s)'];
            const terms: ChemistryTerm[] = [];
            tests.forEach(
                function(item, index) {
                    terms[index] = parse(item) as ChemistryTerm;
                }
            )
            // Assert
            terms.forEach(
                function(item, index) {
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
            const AST = parseChemistryExpression('e\^{-} (s)') as ErrorToken;

            // Assert
            expect(AST.type).toBe('error');
            expect(AST.value).toBe('(s)');
        }
    );
    it("Returns an 'error' when multiple states or coeffs are given",
        () => {
            // Act
            const tests: string[] = ['10 11O2', 'O2 (g) (s)'];
            const errors: ErrorToken[] = []
            tests.forEach(
                function(item) {
                    errors.push(parseChemistryExpression(item) as ErrorToken);
                }
            )
            // Assert
            errors.forEach(
                function(item) {
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
            const ASTExpr = parse('C + C + C') as Expression;

            // Assert
            expect(ASTExpr.term.type).toBe('term');
            expect(ASTExpr.rest.type).toBe('expr');
            expect((ASTExpr.rest as Expression).term.type).toBe('term'); // a cons-list
            expect((ASTExpr.rest as Expression).rest.type).toBe('term');
        }
    );
    it("Returns error when provided with 'term term'",
        () => {
            // Act
            const ASTError = parse('C C');
            // Assert
            expect(ASTError.type).toBe('error');
        }
    );
});

describe("Parser correctly parses statements", () => {
    it("Returns left and right expressions when provided with an arrow",
        () => {
            // Act
            const tests: string[] = ['C->C', 'C<=>C'];
            const statements: Statement[] = [];
            const arrow: string[] = ['SArr', 'DArr'];
            tests.forEach(
                function(item) {
                    statements.push(parse(item) as Statement)
                }
            )

            // Assert
            statements.forEach(
                function(item, index) {
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
            const ASTError = parseChemistryExpression('C C') as ErrorToken;

            // Assert
            expect(ASTError.type).toBe('error');
        }
    );
});
