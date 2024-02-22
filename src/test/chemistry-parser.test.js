import parse from '../parseChem'

describe("Parser captures lexing errors", () => {
    it("Returns 'error' object when parsing an error",
        () => {
            // Act
            const AST = parse("C!C")[0];
            // The first node should be a 'C!' error
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('!');
        }
    );
});

describe("Parser correctly parses elements", () => {
    it("Returns an 'element' object when given a standalone element",
        () => {
            // Act
            const AST = parse('C')[0];
            const element = AST.result.value; // Everything below a 'term' is wrapped in a 'term'

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
                    const AST = parse(item)[0];
                    // Everything below a 'term' is wrapped in a 'term'
                    elements[index] = AST.result.value;
                }
            )

            // Assert
            elements.forEach(
                function(item, index, _arr) {
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
            const AST = parse('Hz')[0];
            const error = AST.result;
            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('z');
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
                    const AST = parse(item)[0];
                    brackets.push(AST.result.value) // Wrapped in a 'term'
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
                    const AST = parse(item)[0];
                    brackets[index] = AST.result.value; // Wrapped in a 'term'
                }
            );
            // Assert
            brackets.forEach(
                function(item, index, _arr) {
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
            const tests = ['()', '[]', '(C)', '[C]'];
            const errors = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item)[0];
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
            // All wrapped in 'term's
            const heads = [
                parse('C')[0].result.value,
                parse('C')[0].result.value,
                parse('(HO)2')[0].result.value
            ];
            const tails = [
                parse('O2')[0].result.value,
                parse('H3[CH2]4CH3')[0].result.value,
                parse('[CO]3')[0].result.value
            ];
            const compounds = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item)[0];
                    compounds[index] = AST.result.value; // Wrapped in a term
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
            const AST = parse('[C]')[0];
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe(']');
        }
    );
});

// The 'molecule' rule is just a syntactic sugar in the parser
// If element or molecule pass/fail then molecule does the same

describe("Parser correctly parses ions", () => {
    it("Returns a 'ion' when provided with a charge",
        () => {
            // Act
            const tests = ['Na\^{+}', 'Cl-', 'Cl\^{-}', 'Fe\^{2+}', 'N\^{3-}'];
            const charges = [1, -1, -1, 2, -3];
            // Wrapped in 'term's
            const molecules = [
                parse('Na')[0].result.value,
                parse('Cl')[0].result.value,
                parse('Cl')[0].result.value,
                parse('Fe')[0].result.value,
                parse('N')[0].result.value
            ]
            const ions = [];
            tests.forEach(
                function(item, index, _arr){
                    const AST = parse(item)[0];
                    ions[index] = AST.result.value; // Wrapped in a 'term'
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
            const AST = parse('Na\^{+}Cl-F\^{-}P\^{+}')[0];
            const ion = AST.result.value; // Everything below a 'term' is wrapped in a 'term'
            // Assert
            expect(ion.type).toBe('ion');
            expect(ion.charge).toBe(1);
            // Stored as a cons-list
            // TODO: check if this property is required and if lists are better
            expect(ion.molecule).toEqual(parse('Na')[0].result.value); // Wrapped in a 'term'
            expect(ion.chain).toBeDefined();
            expect(ion.chain).toEqual(parse('Cl-F\^{-}P\^{+}')[0].result.value); // Wrapped in a 'term'
        }
    );
    it("Returns an 'error' object when provided with an incorrect charge",
        () => {
            // Act
            const tests = ['Cl--', 'Na\^{+}\^{+}', 'Cl\^{-}\^{-}'];
            const values = ['-', '\^{+}', '\^{-}'];
            const errors = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item)[0];
                    errors.push(AST.result);
                }
            )

            // Assert
            errors.forEach(
                function(item, index, _arr) {
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
            const tests = ['e\^{-}', '\\electron\^{-}'];
            const terms = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item)[0];
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
            const AST = parse('MgSO4 . 7H2O')[0];
            const value = parse('MgSO4')[0].result.value; // Wrapped in a 'term'
            const term = AST.result;

            // Assert
            expect(term.type).toBe('term');
            expect(term.isHydrate).toBeTruthy();
            expect(term.value).toEqual(value)
            expect(term.hydrate).toBe(7);
        }
    );
    it("Returns a 'term' when given a coefficient",
        () => {
            // Act
            const tests = ['2e\^{-}', '100Na\^{+}', '99NaCl . 6H2O'];
            const coeffs = [
                { "numerator": 2, "denominator": 1 },
                { "numerator": 100, "denominator": 1 },
                { "numerator": 99, "denominator": 1 }
            ];
            const ASTs = [
                {}, // Electron does not have a value
                parse('Na\^{+}')[0].result.value, // Wrapped in a 'term'
                parse('NaCl . 6H2O')[0].result.value // Wrapped in a 'term'
            ];
            const terms = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item)[0];
                    terms[index] = AST.result;
                }
            )
            // Assert
            terms.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('term');
                    expect(item.coeff).toEqual(coeffs[index]);
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
            // Wrapped in 'term's
            const ASTs = [
                parse('Mg')[0].result.value,
                parse('NaCl')[0].result.value,
                parse('MgSO4')[0].result.value
            ];
            const states = ['(g)', '(aq)', '(s)'];
            const terms = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item)[0];
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
            const AST = parse('e\^{-} (s)')[0];
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('(s)');
        }
    );
    it("Returns an 'error' when multiple states or coeffs are given",
        () => {
            // Act
            const tests = ['10 11O2', 'O2 (g) (s)'];
            const errors = []
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parse(item)[0];
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
            const AST = parse('C + C + C')[0];
            const expr = AST.result;

            // Assert
            expect(expr.term.type).toBe('term');
            expect(expr.rest.type).toBe('expr');
            expect(expr.rest.term.type).toBe('term'); // a cons-list
            expect(expr.rest.rest.type).toBe('term');
        }
    );
    it("Returns error when provided with 'term term'",
        () => {
            // Act
            const AST = parse('C C')[0];
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
            const arrow = ['SArr', 'DArr'];
            ['C->C', 'C<=>C'].forEach(
                function(item, _index, _arr) {
                    const AST = parse(item)[0];
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
            const AST = parse('C C')[0];
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
        }
    );
});
