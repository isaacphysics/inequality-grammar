import parseChem from "./parseChem";
import { _findRightmost, _simplify } from "./utils";

let _window = null
try {
    _window = window
} catch (error) {
    _window = { innerWidth: 800, innerHeight: 600 }
}

function convertCoefficient(coefficient) {
    if (coefficient.numerator === 1 && coefficient.denominator === 1) {
        // This isn't really a coefficient
        return undefined;
    }
    if (coefficient.denominator !== 1) {
        if (coefficient < 1) {
            console.error("Negative denominator encounter. Fraction should be normalised!");
            return undefined;
        }
        return {
            type: 'Fraction',
            children: {
                numerator: {
                    type: 'Num',
                    properties: { significand: coefficient.numerator },
                    children: {}
                },
                denominator: {
                    type: 'Num',
                    properties: { significand: coefficient.denominator },
                    children: {}
                }
            }
        };
    }

    // Must be a whole number coefficient
    return { type: 'Num', properties: { significand: coefficient.numerator }, children: {} };
}

function convertNode(node) {
    switch(node.type) {
        case 'statement': {
            let lhs = convertNode(node.left);
            const rhs = convertNode(node.right);
            const relText = node.arrow === "DArr" ? 'equilibrium' : 'rightarrow';
            const statement = {
                type: 'Relation',
                properties: { relation: relText },
                children: { right: rhs }
            }

            const rightMost = _findRightmost(lhs);
            rightMost.children['right'] = statement;
            lhs = _simplify(lhs);

            return { ...lhs };
        }
        case 'expr': {
            let lhs = convertNode(node.term);
            const rhs = convertNode(node.rest);
            const expression = {
                type: 'BinaryOperation',
                properties: { operation: '+' },
                children: { right: rhs }
            }

            const rightMost = _findRightmost(lhs);
            rightMost.children['right'] = expression;

            return { ...lhs };
        }
        case 'term': {
            let lhs = convertCoefficient(node.coeff);
            let rightMost = {}

            if (node.isElectron) {
                const electron = {
                    type: 'Particle',
                    properties: { type: 'electron', particle: '\\electron' },
                    children: {}
                }

                if (lhs === undefined) {
                    // If there is no coefficient return the bare electron
                    return electron;
                }

                rightMost = _findRightmost(lhs);
                rightMost.children['right'] = electron;
                return lhs;
            }

            // Update lhs appropriately
            const value = convertNode(node.value);
            if (lhs === undefined) {
                // If there is no coefficient use the value instead
                lhs = value;
            } else {
                // Otherwise attach value
                rightMost = _findRightmost(lhs);
                rightMost.children['right'] = value;
            }
            // Update rightmost
            rightMost = _findRightmost(value);

            if (node.isHydrate) {
                const water = {
                    type: 'ChemicalElement',
                    properties: { element: 'H' },
                    children: {
                        subscript: { type: 'Num', properties: { significand: 2 }, children: {} },
                        right: { type: 'ChemicalElement', properties: { element: 'O' }, children: {} }
                    }
                }
                const hydrate = node.hydrate > 1
                    ? { type: 'Num', properties: { significand: node.hydrate }, children: { right: water } }
                    : water;
                const hydrateRel = {
                    type: 'Relation',
                    properties: { relation: '.' },
                    children: { right: hydrate }
                }

                rightMost.children['right'] = hydrateRel;
                // Update rightmost to end of hydrate
                rightMost = _findRightmost(hydrateRel);
            }

            // Attach the state
            if (node.state !== '') {
                rightMost.children['right'] = {
                    type: 'StateSymbol',
                    properties: { state: node.state },
                    children: {}
                };
            }

            return lhs;
        }
        case 'ion': {
            const lhs = convertNode(node.molecule);
            const rightMost = _findRightmost(lhs)

            let charge = {
                type: 'BinaryOperation',
                properties: { operation: node.charge < 0 ? '-' : '+'},
                children: {}
            };
            if (Math.abs(node.charge) !== 1) {
                charge = {
                    type: 'Num',
                    properties: { significand: Math.abs(node.charge) },
                    children: { right: charge }
                }
            }

            rightMost.children['superscript'] = charge;

            if (node.chain) {
                const chain = convertNode(node.chain);
                rightMost.children['right'] = chain;
            }

            return { ...lhs };
        }
        case 'compound': {
            const lhs = convertNode(node.head);
            const rhs = convertNode(node.tail);
            const rightMost = _findRightmost(lhs);
            rightMost.children['right'] = rhs;
            return { ...lhs }
        }
        case 'bracket': {
            console.log('bracket:', node);
            const compound = convertNode(node.compound);
            const bracket = {
                type: 'Brackets',
                properties: { type: node.bracket },
                children: { argument: compound }
            }

            if (node.coeff > 1) {
                // Only attach coefficient if it's meaningful
                bracket.children['subscript'] = {
                    type: 'Num',
                    properties: { significand: node.coeff },
                    children: {}
                }
            }
            return bracket;
        }
        case 'element': {
            const element = {
                type: 'ChemicalElement',
                properties: { element: node.value },
                children: {}
            }

            if (node.coeff > 1) {
                element.children['subscript'] = {
                    type: 'Num',
                    properties: { significand: node.coeff},
                    children: {}
                }
            }
            return element
        }
        default: {
            console.error("Unknown type:", node.type);
            return {};
        }
    }
}

function convertToInequality(ast) {
    const inequalityAST = convertNode(ast.result);
    inequalityAST.position = { x: _window.innerWidth/4, y: _window.innerHeight/3 }
    inequalityAST.expression = { latex: "", python: "" }
    return _simplify(inequalityAST);
}

export default function(expression = '') {
    const parsedExpressions = parseChem(expression);
    return parsedExpressions.map(convertToInequality);
}
