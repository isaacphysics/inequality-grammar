//@ts-ignore
import grammar from '../../assets/nuclear-grammar.ne';
import { Token } from '../types';

// const compiledGrammar = Grammar.fromCompiled(grammar);
const lexer = grammar.Lexer;

describe("Lexer captures non-lexicon tokens as 'Error'", () => {
    it("Lexes non-lexicon character '!' as 'Error'",
        () => {
            // Act
            lexer.reset("!");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Error');
        }
    );
    it("Produces 'Error' with only the non-lexicon character",
        () => {
            // Act
            lexer.reset("C!C");
            lexer.next() // Consume the 'C'
            const error = lexer.next();
            const token = lexer.next();

            // Assert
            expect(error.type).toBe('Error');
            expect(error.value).toBe('!');
            expect(token.value).toBe('C');
        }
    );
});

describe("Lexer correctly identifies 'End' symbol", () => {
    it("Lexes ';' as 'End'",
        () => {
            // Act
            lexer.reset(";");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('End');
        }
    );
    it("Fails to lex ':' as 'End'",
        () => {
            // Act
            lexer.reset(":");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Error');
            expect(token.value).toBe(':');
        }
    );
});

describe("Lexe correctly identifies 'Arrow' symbol", () => {
    it("Lexes '->' as 'Arrow'",
        () => {
            // Act
            lexer.reset("->");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Arrow');
        }
    );
    it("Fails to lex '<->', '<=>', '>', '=>', and '<='",
        () => {
            // Act
            const tests: string[] = ['<->', '<=>', '>', '=>', '<='];
            const tokens: Token[] = [];
            tests.forEach(
                function(input, index, arr) {
                    lexer.reset(input);
                    arr[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(token) {
                    expect(token.type).toBe('Error');
                }
            )
        }
    );
});

describe("Lexer correctly identifies 'Charge' symbol", () => {
    it("Lexes '\^{+}' as 'Positive'",
        () => {
            // Act
            lexer.reset("\^{+}");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Positive');
        }
    );
    it("Lexes '\^{-}', '-' as 'Negative'",
        () => {
            // Act
            lexer.reset("\^{-}");
            const token = lexer.next();
            lexer.reset("-");
            const token2 = lexer.next();

            // Assert
            expect(token.type).toBe('Negative');
            expect(token2.type).toBe('Negative');
        }
    );
    it("Lexes '\^{NUM[+-]}' as 'Charge(\^{NUM[+-]})",
        () => {
            // Act
            lexer.reset("\^{2+}\^{19-}");
            const pos = lexer.next();
            const neg = lexer.next();

            // Assert
            expect(pos.type).toBe('Charge');
            expect(neg.type).toBe('Charge');
            expect(pos.value).toBe('\^{2+}');
            expect(neg.value).toBe('\^{19-}');
        }
    );
    it("Fails to lex '\^{++}', '\^{+', '\^+}', '\^+'",
        () => {
            // Act
            const tests: string[] = ['\^{++}', '\^{+', '\^+}', '\^+'];
            const tokens: Token[] = []
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item) {
                    expect(item.type).toBe('Error');
                }
            )
        }
    );
});

describe("Lexer correctly identifies coefficients", () => {
    it("Lexes '3' and '247' as 'Number(NUM)'",
        () => {
            // Act
            lexer.reset("3 247");
            const three = lexer.next();
            lexer.next() // consume the whitespace
            const big = lexer.next();

            // Assert
            expect(three.type).toBe('Num');
            expect(big.type).toBe('Num');
            expect(three.value).toBe('3');
            expect(big.value).toBe('247');
        }
    );
});

describe("Lexer correctly identifies chemical elements", () => {
    it("Lexes all 118 elements",
        () => {
            // Act
            const elements: string[] = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og']
            const tokens: Token[] = []
            elements.forEach(
                function(item, index, _arr) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe('Element');
                    expect(item.value).toBe(elements[index]);
                }
            )
        }
    );
    it("Fails to lex slightly wrong chemical elements",
        () => {
            // Act
            const elements: string[] = ['Lx', 'Mx', 'Ax', 'Tx', 'Zx', 'Gx', 'Rx', 'Dx', 'Ex'];
            const partial_element: string[] = ['Hx', 'Bx', 'Cx', 'Fx', 'Ix', 'Kx', 'Nx', 'Ox', 'Px', 'Sx', 'Yx'];
            const tokens: Token[] = [];
            const partial_tokens: Token[] = [];
            elements.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            );
            partial_element.forEach(
                function(item, index) {
                    lexer.reset(item);
                    lexer.next(); // consume the single letter chemical
                    partial_tokens[index] = lexer.next();
                }
            );

            // Assert
            tokens.forEach(
                function(item) {
                    expect(item.type).toBe('Error');
                }
            );
            partial_tokens.forEach(
                function(item) {
                    expect(item.type).toBe('Error');
                }
            );
        }
    );
});

describe("Lexer correctly identifies addition", () => {
    it("Lexes '+' as 'Plus'",
        () => {
            // Act
            lexer.reset('+');
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Plus');
        }
    );
});

describe("Lexer correctly identifies brackets", () => {
    it("Lexes '(', ')', '[', ']' as 'Parentheses'",
        () => {
            // Act
            const tests: string[] = ['(', ')', '[', ']'];
            const types: string[] = ['LParen', 'RParen', 'LSquare', 'RSquare'];
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index, _arr) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe(types[index]);
                }
            );
        }
    );
});

describe("Lexer correctly identifies LaTeX No-Op", () => {
    it("Lexes '{}' as 'Nop'",
        () => {
            // Act
            lexer.reset('{}');
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Nop');
        }
    );
});

describe("Lexer correctly identifies mass and atomic numbers", () => {
    it("Lexes '\^{NUM}', '_{NUM}' as 'Mass' and 'Atomic' respectively",
        () => {
            // Act
            lexer.reset('\^{4}_{-348}');
            const types: string[] = ['Mass', 'Atomic'];
            const values: string[] = ['\^{4}', '_{-348}'];
            const tokens: Token[] = Array.from(lexer);

            // Assert
            tokens.forEach(
                function(item, index) {
                    expect(item.type).toBe(types[index]);
                    expect(item.value).toBe(values[index]);
                }
            )
        }
    );
    it("Fails to lex '\^NUM', '_NUM', '\^{NUM', '_{NUM'",
        () => {
            // Act
            const tests: string[] = ['\^2', '_2', '\^{2', '_{2'];
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item) {
                    expect(item.type).toBe('Error');
                }
            )
        }
    );
    it("Fails to lex '\^{-NUM}'",
        () => {
            // Act
            lexer.reset('\^{-2}');
            const error = lexer.next();
            // Assert
            expect(error.type).toBe('Error');
        }
    );
});

describe("Lexer correctly identifies nuclear particles", () => {
    it("Lexes standard set of particles",
        () => {
            // Act
            lexer.reset("e\\alphaparticle\\betaparticle\\gammaray\\neutrino\\antineutrino\\electron\\positron\\neutron\\proton");
            const tokens: Token[] = Array.from(lexer);
            const types: string[] = ["Electron", "Alpha", "Beta", "Gamma", "Neutrino", "AntiNeutrino", "Electron", "Positron", "Neutron", "Proton"]

            // Assert
            tokens.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe(types[index]);
                }
            )
        }
    );
    it("Failes to Lex deviations on spelling",
        () => {
            // Act
            const tests: string[] = ['alpha', 'beta', 'gamma', 'nutrino', 'nutron']
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item) {
                    expect(item.type).toBe('Error');
                }
            )
        }
    );
});

describe("Lexer correctly handles complex expressions", () => {
    it("Lexes '\^{222}_{88}Ra ->  \^{4}_{2}He + \^{218}_{86}Rn;' correctly",
        () => {
            // Act
            const expected: string[] = [
                'Mass',
                'Atomic',
                'Element',
                'WS',
                'Arrow',
                'WS',
                'Mass',
                'Atomic',
                'Element',
                'WS',
                'Plus',
                'WS',
                'Mass',
                'Atomic',
                'Element',
                'End',
            ];
            lexer.reset('\^{222}_{88}Ra -> \^{4}_{2}He + \^{218}_{86}Rn;');
            const tokens: Token[] = Array.from(lexer);

            // Assert
            tokens.forEach(
                function(item, index, _arr) {
                    expect(item.type).toBe(expected[index]);
                }
            )
        }
    );
});
