import _uniqWith from 'lodash/uniqWith'
import _isEqual from 'lodash/isEqual'

import { Parser, Grammar } from 'nearley'
import grammar from '../../assets/nuclear-grammar.ne'

const compiledGrammar = Grammar.fromCompiled(grammar)

const parse = (expression = '') => {
    const parser = new Parser(compiledGrammar)
    let output = null
    try {
        output = _uniqWith(parser.feed(expression).results, _isEqual)
    } catch (error) {
        const token = error.token
        return [{
            result: {
                type: 'error',
                value: token.value,
                loc: (token.line, token.col)
            }
        }];
    }
    return output
}

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

describe("Parser correctly parses isotopes", () => {
    it("Returns an 'isotope' object when given a standalone isotope",
        () => {
            // Act
            const AST = parse('C')[0];
            const isotope = AST.result.value; // Everything below a 'term' is wrapped in a 'term'

            // Assert
            expect(isotope.type).toBe('isotope');
            expect(isotope.value).toBe('C');
        }
    );
    it("Returns a 'isotope' when provided with a charge",
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
            const isotopes = [];
            tests.forEach(
                function(item, index, _arr){
                    const AST = parse(item)[0];
                    isotopes[index] = AST.result.value; // Wrapped in a 'term'
                }
            )
            // Assert
            isotopes.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('isotope');
                    expect(item.charge).toBe(charges[index]);
                    expect(item.molecule).toEqual(molecules[index]);
                }
            )
        }
    );
    it("Returns an 'error' object when invalid isotope provide",
        () => {
            // Act
            const AST = parse('Hz')[0];
            const error = AST.result;
            // Assert
            expect(error.type).toBe('error');
            expect(error.value).toBe('z');
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

describe("Parser correctly parses particles", () => {
    it("Returns a 'particle' with correct mass and atomic number",
        () => {
            // Act
            const tests = [
                '{}^{4}_{2}\\alphaparticle',
                '^{0}_{1}\\betaparticle',
                '_{0}^{0}\\neutrino',
                '{}^{4}_{-1}\\antineutrino'
            ];
            const masses = [4, 0, 0, 4];
            const atomic = [2, 1, 0, -1];
            const particles = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    particles[index] = AST.result.value;
                }
            );

            // Assert
            particles.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('particle');
                    expect(item.mass).toBe(masses[index]);
                    expect(item.atomic).toBe(atomic[index]);
                    expect(item.particle).toBeDefined(); // This is verified later
                }
            );
        }
    );
    it("Returns a 'particle' when given any (standard) nuclear particle",
        () => {
            // Act
            const tests = [
                "^{1}_{1}\\alphaparticle",
                "^{1}_{1}\\betaparticle",
                "\\gammaray", // gamma particles can be bare
                '^{0}_{0}\\gammaray', // or with prescripts
                "^{1}_{1}\\neutrino",
                "^{1}_{1}\\antineutrino",
                "^{1}_{1}e\^{-}",
                "^{1}_{1}\\electron\^{-}",
                "^{1}_{1}\\electron",
                "^{1}_{1}\\positron",
                "^{1}_{1}e\^{+}",
                "^{1}_{1}\\electron\^{+}",
                "^{1}_{1}\\betaparticle\^{+}",
                "^{1}_{1}\\neutron",
                "^{1}_{1}\\proton"
            ];
            const values = [
                "alphaparticle",
                "betaparticle",
                "gammaray",
                "neutrino",
                "antineutrino",
                "electron",
                "electron",
                "electron",
                "positron",
                "positron",
                "positron",
                "positron",
                "neutron",
                "proton"
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
                    expect(item.type).toBe('particle');
                    expect(item.particle).toBe(values[index]);
                }
            )
        }
    );
    it("Returns 'error' when mass and atomic numbers are incorrect or absent",
        () => {
            // Act
            const tests = [
                '\\alphaparticle',
                '^{0}^{1}\\betaparticle',
                '_{0}_{1}\\betaparticle',
                '{}^{4}_{-0}\\alphaparticle',
                '^{-4}_{2}\\alphaparticle',
            ];
            const errors = []
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
            );
        }
    );
    it("Returns 'error' when the particle does not exist",
        () => {
            // Act
            const tests = ['\\alpha', '\\superparticle'];
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
            );
        }
    );
});

describe("Parser correctly parses terms", () => {
    it("Returns a 'term' when given a coefficient and particle",
        () => {
            // Act
            const tests = ['2^{0}_{1}e\^{-}', '100{}^{4}_{2}\\alphaparticle', '\\gammaray'];
            const coeffs = [
                { "numerator": 2, "denominator": 1 },
                { "numerator": 100, "denominator": 1 },
                { "numerator": 1, "denominator": 1 }
            ];
            const ASTs = [
                // Wrapped in terms
                parse('^{0}_{1}e\^{-}')[0].result.value,
                parse('{}^{4}_{2}\\alphaparticle')[0].result.value,
                parse('\\grammaray')[0].result.value
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
                    expect(item.value).toEqual(ASTs[index]);
                }
            )
        }
    );
    it("Returns a 'term' when given prescripts and an isotope",
        () => {
            // Act
            const tests = ["{}^{2}_{1}H\^{-}", "{}_{6}^{13}C", "^{235}_{92}U", "_{36}^{92}Kr"];
            const masses = [2, 13, 235, 92];
            const atomics = [1, 6,92, 36];
            const values = [
                // Wrapped in 'term's
                parse('H\^{-}').result.value,
                parse('C').result.value,
                parse('U').result.value,
                parse('Kr').result.value
            ]
            const terms = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parse(item);
                    terms[index] = AST.result;
                }
            );
            // Assert
            terms.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('term');
                    expect(item.value).toBe(values[index]);
                    expect(item.mass).toBe(masses[index]);
                    expect(item.atomic).toBe(atomics[index]);
                }
            );
        }
    );
    it("Returns an 'error' when given nuclear prescripts or isotope coefficients",
        () => {
            // Act
            const tests = ['{}^{1}_{1}^{1}_{1}\\betaparticle', '2^{4}_{2}He', '2O'];
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
    it("Returns an 'error' when given multiple prescripts or coefficients",
        () => {
            // Act
            const tests = ['2 2^{4}_{2}\\alphaparticle', '{}^{235}_{92}^{235}_{92}U'];
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
            const AST = parse('^{235}_{92}U + ^{1}_{0}\\neutron + ^{92}_{36}Kr')[0];
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
            const AST = parse('{}^{235}_{92}U {}^{235}_{92}U')[0];
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
            const arrow = ['Arrow'];
            ['{}^{0}_{1}\\betaparticle -> {}^{0}_{1}\\betaparticle', ].forEach(
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
    it("Returns an 'error' when provided with a double arrow",
        () => {
            // Act
            const AST = parse('C<=>C');
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
        }
    );
    it("Returns error when provided with 'expr expr'",
        () => {
            // Act
            const AST = parse('{}^{235}_{92}U {}^{235}_{92}U')[0];
            const error = AST.result;

            // Assert
            expect(error.type).toBe('error');
        }
    );
});
