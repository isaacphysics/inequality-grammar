import { parseNuclearExpression } from '../parseNuclear';
import { ErrorToken, Expression, isErrorToken, isNuclearTerm, Isotope, NuclearTerm, Particle, Result, Statement } from '../types';

// The nearley parser returns an array of ASTs (in case of ambiguity). The grammar is unambiguous so the array will always have one element
function parse(expression: string): Result {
    const a = parseNuclearExpression(expression);
    if (isErrorToken(a)) {
        return { type: 'error', value: 'Use parseNuclearExpression to test errors', loc: [0,0] };
    }
    return a[0].result;
}

// All nodes below Term are wrapped in a Term. This abstraction function is therefore useful for typeguarding and compactness
function parseTerm(expression: string): NuclearTerm {
    const a = parse(expression);
    if (isNuclearTerm(a)) {
        return a;
    }
    return { type: 'term' } as NuclearTerm;
}


describe("Parser captures lexing errors", () => {
    it("Returns 'term' object when parsing an isotope without mass or atomic number",
        () => {
            // Act
            const ASTTerm = parse("C") as NuclearTerm;
            // The first node should be a 'C' term

            // Assert
            expect(ASTTerm.type).toBe('term');
            expect((ASTTerm.value as Isotope).element).toBe('C');
        }
    );
});

describe("Parser correctly parses isotopes", () => {
    it("Returns an 'isotope' object when given a standalone isotope",
        () => {
            // Act
            const AST = parseTerm('{}^{13}_{6}C');
            const isotope = AST.value as Isotope;

            // Assert
            expect(isotope.type).toBe('isotope');
            expect(isotope.element).toBe('C');
        }
    );
    it("Returns an 'isotope' when given prescripts",
        () => {
            // Act
            const tests: string[] = ["{}\^{2}_{1}H", "{}_{6}\^{13}C", "\^{235}_{92}U", "_{36}\^{92}Kr"];
            const masses: number[] = [2, 13, 235, 92];
            const atomics: number[] = [1, 6,92, 36];
            const elements: string[] = ['H','C','U','Kr'];
            const isotopes: Isotope[] = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parseTerm(item);
                    isotopes[index] = AST.value as Isotope;
                }
            );
            // Assert
            isotopes.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('isotope');
                    expect(item.element).toBe(elements[index]);
                    expect(item.mass).toBe(masses[index]);
                    expect(item.atomic).toBe(atomics[index]);
                }
            );
        }
    );
    it("Returns an 'error' object when invalid isotope provide",
        () => {
            // Act
            const ASTError = parseNuclearExpression('{}^{1}_{1}Hz') as ErrorToken;

            // Assert
            expect(ASTError.type).toBe('error');
            expect(ASTError.value).toBe('z');
        }
    );
    it("Returns an 'error' object when provided with a charge",
        () => {
            // Act
            const tests: string[] = [
                '{}^{1}_{1}Cl-',
                '{}^{1}_{1}Na\^{+}',
                '{}^{1}_{1}Cl\^{-}'
            ];
            const values: string[] = ['-', '\^{+}', '\^{-}'];
            const errors: ErrorToken[] = [];
            tests.forEach(
                function(item, _index, _arr) {
                    errors.push(parseNuclearExpression(item) as ErrorToken);
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
            const tests: string[] = [
                '{}^{4}_{2}\\alphaparticle',
                '^{0}_{1}\\betaparticle',
                '_{0}^{0}\\neutrino',
                '{}^{4}_{-1}\\antineutrino'
            ];
            const masses: number[] = [4, 0, 0, 4];
            const atomic: number[] = [2, 1, 0, -1];
            const particles: Particle[] = [];
            tests.forEach(
                function(item, index, _arr) {
                    const AST = parseTerm(item)
                    particles[index] = AST.value as Particle;
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
            const tests: string[] = [
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
            const values: string[] = [
                "alphaparticle",
                "betaparticle",
                "gammaray",
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
            const particles: Particle[] = [];
            tests.forEach(
                function(item, index) {
                    particles[index] = parseTerm(item).value as Particle;
                }
            )

            // Assert
            particles.forEach(
                function(item, index) {
                    expect(item.particle).toBe(values[index]);
                }
            )
        }
    );
    it("Returns 'particle' when mass and atomic numbers are absent",
        () => {
            // Act
            const tests: string[] = ['\\alphaparticle', '\\betaparticle', '\\gammaray'];
            const particles: Particle[] = [];
            tests.forEach(
                function(item, _index, _arr) {
                    const AST = parseTerm(item);
                    particles.push(AST.value as Particle)
                }
            );

            // Assert
            particles.forEach(
                function(item, _index, _arr) {
                    expect(item.type).toBe('particle');
                }
            );
        }
    );
    it("Returns 'error' when mass and atomic numbers are incorrect",
        () => {
            // Act
            const tests: string[] = [
                '^{0}^{1}\\betaparticle',
                '_{0}_{1}\\betaparticle',
                '^{-4}_{2}\\alphaparticle',
            ];
            const errors: ErrorToken[] = []
            tests.forEach(
                function(item, _index, _arr) {
                    errors.push(parseNuclearExpression(item) as ErrorToken);
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
            const tests: string[] = ['^{1}_{1}\\alpha', '^{1}_{1}\\superparticle'];
            const errors: ErrorToken[] = [];
            tests.forEach(
                function(item, _index, _arr) {
                    errors.push(parseNuclearExpression(item) as ErrorToken);
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
            const tests: string[] = ['2^{0}_{1}e\^{-}', '100{}^{4}_{2}\\alphaparticle', '\\gammaray'];
            const coeffs: number[] = [2, 100, 1];
            const ASTs: (Isotope | Particle)[] = [
                // Wrapped in terms
                parseTerm('^{0}_{1}e\^{-}').value,
                parseTerm('{}^{4}_{2}\\alphaparticle').value,
                parseTerm('\\gammaray').value
            ];
            const terms: NuclearTerm[] = [];
            tests.forEach(
                function(item, index, _arr) {
                    terms[index] = parse(item) as NuclearTerm;
                }
            )
            // Assert
            terms.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('term');
                    expect(item.coeff).toEqual(coeffs[index]);
                    expect(item.value).toEqual(ASTs[index]);
                    expect(item.isParticle).toBeTruthy();
                }
            )
        }
    );
    it("Returns a 'term' when given prescripts and an isotope",
        () => {
            // Act
            const tests: string[] = ["{}\^{2}_{1}H", "{}_{6}\^{13}C", "\^{235}_{92}U", "_{36}\^{92}Kr"];
            const elements: string[] = ['H','C','U','Kr'];
            const terms: NuclearTerm[] = [];
            tests.forEach(
                function(item, index, _arr) {
                    terms[index] = parse(item) as NuclearTerm;
                }
            );
            // Assert
            terms.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('term');
                    // Trying to do a sub-parse would result having to compare the same parse to itself
                    expect(item.value.type).toBe('isotope');
                    expect((item.value as Isotope).element).toBe(elements[index]);
                    expect(item.isParticle).toBeFalsy();
                }
            );
        }
    );
    it("Returns an 'error' when given nuclear prescripts or isotope coefficients",
        () => {
            // Act
            const tests: string[] = ['{}^{1}_{1}^{1}_{1}\\betaparticle', '2^{4}_{2}He', '2O'];
            const errors: ErrorToken[] = []
            tests.forEach(
                function(item, _index, _arr) {
                    errors.push(parse(item) as ErrorToken);
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
            const tests: string[] = ['2 2^{4}_{2}\\alphaparticle', '{}^{235}_{92}^{235}_{92}U'];
            const errors: ErrorToken[] = []
            tests.forEach(
                function(item, _index, _arr) {
                    errors.push(parse(item) as ErrorToken);
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
            const ASTExpr = parse('^{235}_{92}U + ^{1}_{0}\\neutron + ^{92}_{36}Kr') as Expression;

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
            const ASTError = parse('{}^{235}_{92}U {}^{235}_{92}U');
            // Assert
            expect(ASTError.type).toBe('error');
        }
    );
});

describe("Parser correctly parses statements", () => {
    it("Returns left and right expressions when provided with an arrow",
        () => {
            // Act
            const ASTStatement = parse('{}^{0}_{1}\\betaparticle -> {}^{0}_{1}\\betaparticle') as Statement;

            // Assert
            expect(ASTStatement.left).toBeDefined();
            expect(ASTStatement.right).toBeDefined();
        }
    );
    it("Returns an 'error' when provided with a double arrow",
        () => {
            // Act
            const ASTError = parse('C<=>C');

            // Assert
            expect(ASTError.type).toBe('error');
        }
    );
    it("Returns error when provided with 'expr expr'",
        () => {
            // Act
            const ASTError = parse('{}^{235}_{92}U {}^{235}_{92}U');

            // Assert
            expect(ASTError.type).toBe('error');
        }
    );
});
