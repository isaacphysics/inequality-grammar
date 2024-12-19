//@ts-ignore
import grammar from '../../assets/chemistry-grammar.ne';
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
    it("Lexes '->' as 'SArr'",
        () => {
            // Act
            lexer.reset("->");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('SArr');
        }
    );
    it("Lexes '<=>' as 'DArr'",
        () => {
            // Act
            lexer.reset("<=>");
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('DArr');
        }
    );
    it("Fails to lex '<->', '<==>', '>', '=>', and '<='",
        () => {
            // Act
            const tests: string[] = ['<->', '<==>', '>', '=>', '<='];
            const tokens: Token[] = [];
            tests.forEach(
                function(input, index) {
                    lexer.reset(input);
                    tokens[index] = lexer.next();
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
    it("Fails to lex '\^{++}', '\^{}', '\^{+', '\^+}', '\^+'",
        () => {
            // Act
            const tests: string[] = ['\^{++}', '\^{}', '\^{+', '\^+}', '\^+'];
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

describe("Lexer correctly identifies subcripts", () => {
    it("Lexes '_{20}' as 'SUB(_{20})'",
        () => {
            // Act
            lexer.reset('_{20}');
            const token = lexer.next();

            // Assert
            expect(token.type).toBe('Sub');
            expect(token.value).toBe('_{20}');
        }
    );
    it("Fails to lex '_20', '_{}'",
        () => {
            // Act
            const tests: string[] = ['_20', '_{}'];
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

describe("Lexer correctly identifies fractions", () => {
    it("Lexes '\\frac{1}{2}' as 'Frac(\\frac{1}{2})'",
        () => {
            // Act
            lexer.reset("\\frac{1}{2}");
            const fraction = lexer.next();

            // Assert
            expect(fraction.type).toBe("Frac");
            expect(fraction.value).toBe("\\frac{1}{2}");
        }
    );
    it("Lexes '1/202' as [Num, Slash, Num]",
        () => {
            // Act
            lexer.reset('1/202');
            const numerator = lexer.next();
            const slash = lexer.next();
            const denominator = lexer.next();

            // Assert
            expect(numerator.type).toBe('Num');
            expect(slash.type).toBe('Slash');
            expect(denominator.type).toBe('Num');
        }
    );
    it("Fails to lex '\\frac12', '\\frac{1}2', '\\frac1{2}', '\\frac{1{2}', 'frac{1}{2}'",
        () => {
            // Act
            const tests: string[] = ['\\frac12', '\\frac{1}2', '\\frac1{2}', '\\frac{1{2}', 'frac{1}{2}'];
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
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

describe("Lexer correctly identifies state symbols", () => {
    it("Lexes '(s)', '(l)', '(g)', '(m)', '(aq)' as State(SYM)",
        () => {
            // Act
            const tests: string[] = ['(s)', '(l)', '(g)', '(m)', '(aq)'];
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(token, index) {
                    expect(token.type).toBe('State');
                    expect(token.value).toBe(tests[index]);
                }
            )
        }
    );
    it("Fails to lex 's', '(sl)', '(s', 's)'",
        () => {
            // Act
            const tests: string[] = ['s', '(sl)', '(s', 's)']
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    if ([1, 2].includes(index)) {
                        lexer.next() // Consume the parenthesis
                    }
                    tokens[index] = lexer.next();
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

describe("Lexer correctly identifies chemical elements", () => {
    it("Lexes all 118 elements",
        () => {
            // Act
            const elements: string[] = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og']
            const tokens: Token[] = []
            elements.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item, index) {
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

describe("Lexer correctly identifies hydrates", () => {
    it("Lexes '.H2O', '. H2O', '. NUM H2O', '.NUMH2O' as 'Water'",
        () => {
            // Act
            const test: string[] = ['.H2O', '. H2O', '. 3 H2O', '.20H2O'];
            const tokens: Token[] = [];
            test.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            );

            // Assert
            tokens.forEach(
                function(item, index) {
                    expect(item.type).toBe('Water');
                    expect(item.value).toBe(test[index]);
                }
            );
        }
    );
    it("Fails to lex 'H2O', 'NUM . H2O' as 'Water'",
        () => {
            // Act
            const test: string[] = ['H2O', '538 . H2O'];
            const tokens: Token[] = [];
            test.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item) {
                    expect(item.type).not.toBe('Water');
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
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            )

            // Assert
            tokens.forEach(
                function(item, index) {
                    expect(item.type).toBe(types[index]);
                }
            );
        }
    );
    it("Fails to lex '{', '}'",
        () => {
            // Act
            const tests: string[] = ['{', '}'];
            const tokens: Token[] = [];
            tests.forEach(
                function(item, index) {
                    lexer.reset(item);
                    tokens[index] = lexer.next();
                }
            );

            // Assert
            tokens.forEach(
                function(item) {
                    expect(item.type).toBe('Error');
                }
            );
        }
    );
});

describe("Lexer correctly identifies electrons", () => {
    it("Lexes 'e', 'e-', 'e^{-}', 'electron^{-}' as 'Electron'",
        () => {
            // Act
            const tests: string[] = ['e', 'e-', 'e^{-}', '\\electron^{-}', '\\electron-'];
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
                    expect(item.type).toBe('Electron');
                }
            )
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

describe("Lexer correctly handles complex expressions", () => {
    it("Lexes 'MgNaAl5((Si2O4)2O2)3(OH)6' correctly",
        () => {
            // Act
            const expected: string[] = [
                'Element',
                'Element',
                'Element',
                'Num',
                'LParen',
                'LParen',
                'Element',
                'Num',
                'Element',
                'Num',
                'RParen',
                'Num',
                'Element',
                'Num',
                'RParen',
                'Num',
                'LParen',
                'Element',
                'Element',
                'RParen',
                'Num'
            ];
            lexer.reset('MgNaAl5((Si2O4)2O2)3(OH)6');
            const tokens: Token[] = Array.from(lexer);

            // Assert
            tokens.forEach(
                function(item, index) {
                    expect(item.type).toBe(expected[index]);
                }
            )
        }
    );
});
