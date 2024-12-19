import { parseChemistryExpression } from "./parseChem";
import {  isStatement , InequalityWidget, NuclearAST, isExpression, isChemistryTerm, isBracket, isCompound, isElement, isIon, Fraction } from "./types";
import { _findRightmost, _simplify } from "./utils";

let _window: { innerWidth: number, innerHeight: number };
try {
    _window = window
} catch (error) {
    _window = { innerWidth: 800, innerHeight: 600 }
}

function convertCoefficient(coefficient: Fraction): InequalityWidget | undefined { // make this throw an error >:(
    if (coefficient.numerator === 1 && coefficient.denominator === 1) {
        // This isn't really a coefficient
        return undefined;
    }
    if (coefficient.denominator !== 1) {
        if (coefficient.denominator < 0) {
            console.error("Negative denominator encounter. Fraction should be normalised!");
            return undefined;
        }
        return {
            type: 'Fraction',
            children: {
                numerator: {
                    type: 'Num',
                    properties: { significand: coefficient.numerator.toString() },
                    children: {}
                },
                denominator: {
                    type: 'Num',
                    properties: { significand: coefficient.denominator.toString() },
                    children: {}
                }
            }
        };
    }

    // Must be a whole number coefficient
    return { type: 'Num', properties: { significand: coefficient.numerator.toString() }, children: {} };
}

function convertNode<T extends InequalityWidget>(node: T): InequalityWidget {
    switch(node.type) {
        case 'statement': {
            if (isStatement(node)) {
                let lhs = convertNode(node.left);
                const rhs = convertNode(node.right);
                const relText = node.arrow === "DArr" ? 'equilibrium' : 'rightarrow';
                const statement = {
                    type: 'Relation',
                    properties: { relation: relText },
                    children: { right: rhs }
                }

                const rightMost = _findRightmost(lhs);
                if (rightMost.children) {
                    rightMost.children.right = statement;
                }
                lhs = _simplify(lhs);

                return { ...lhs };
            }
        }
        case 'expr': {
            if (isExpression(node)) {
                let lhs = convertNode(node.term);
                if (node.rest) {
                    const rhs = convertNode(node.rest);
                    const expression = {
                        type: 'BinaryOperation',
                        properties: { operation: '+' },
                        children: { right: rhs }
                    }

                    const rightMost = _findRightmost(lhs);
                    if (rightMost.children) {
                        rightMost.children.right = expression;
                    }
                }
                return { ...lhs };
            }
        }
        case 'term': {
            if (isChemistryTerm(node)) {
                let lhs = convertCoefficient(node.coeff);
                let rightMost: InequalityWidget;

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
                    if(rightMost.children) {
                        rightMost.children.right = electron;
                    }
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
                    if (rightMost.children) {
                        rightMost.children.right = value;
                    }
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
                        ? { type: 'Num', properties: { significand: node.hydrate.toString() }, children: { right: water } }
                        : water;
                    const hydrateRel = {
                        type: 'Relation',
                        properties: { relation: '.' },
                        children: { right: hydrate }
                    }

                    if (rightMost.children) {
                        rightMost.children.right = hydrateRel;
                    }
                    // Update rightmost to end of hydrate
                    rightMost = _findRightmost(hydrateRel);
                }

                // Attach the state
                if (node.state !== '') {
                    if (rightMost.children) {
                        rightMost.children.right = {
                            type: 'StateSymbol',
                            properties: { state: node.state },
                            children: {}
                        };
                    }
                }

                return lhs;
            }
        }
        case 'ion': {
            if (isIon(node)) {
                const lhs = convertNode(node.molecule);
                const rightMost = _findRightmost(lhs)

                let charge: InequalityWidget = {
                    type: 'BinaryOperation',
                    properties: { operation: node.charge < 0 ? '-' : '+'},
                    children: {}
                };
                if (Math.abs(node.charge) !== 1) {
                    charge = {
                        type: 'Num',
                        properties: { significand: Math.abs(node.charge).toString() },
                        children: { right: charge }
                    }
                }
                if (rightMost.children) {
                    rightMost.children.superscript = charge;

                    if (node.chain) {
                        const chain = convertNode(node.chain);
                        rightMost.children.right = chain;
                    }
                }

                return { ...lhs };
            }
        }
        case 'compound': {
            if(isCompound(node)) {
                const lhs = convertNode(node.head);
                const rhs = convertNode(node.tail);
                const rightMost = _findRightmost(lhs);
                if (rightMost.children) {
                    rightMost.children.right = rhs; 
                }
                return { ...lhs }
            }
        }
        case 'bracket': {
            if(isBracket(node)) {
                const compound = convertNode(node.compound);
                const bracket: InequalityWidget = {
                    type: 'Brackets',
                    properties: { type: node.bracket },
                    children: { argument: compound }
                }

                if (node.coeff !== 1 && bracket.children) {
                    // Only attach coefficient if it's meaningful
                    bracket.children.subscript = {
                        type: 'Num',
                        properties: { significand: node.coeff.toString() },
                        children: {}
                    }
                }
                return bracket;
            }
        }
        case 'element': {
            if(isElement(node)) {
                const element: InequalityWidget = {
                    type: 'ChemicalElement',
                    properties: { element: node.value },
                    children: {}
                }

                if (node.coeff !== 1 && element.children) {
                    element.children.subscript = {
                        type: 'Num',
                        properties: { significand: node.coeff.toString() },
                        children: {}
                    }
                }
                return element
            }
        }
        default: {
            console.error("Unknown type:", node.type);
            return {} as InequalityWidget;
        }
    }
}

function convertToInequality(ast: NuclearAST) {
    const inequalityAST = convertNode(ast.result);
    inequalityAST.position = { x: _window.innerWidth/4, y: _window.innerHeight/3 }
    inequalityAST.expression = { latex: "", python: "" }
    return _simplify(inequalityAST);
}

export function parseInequalityChemistryExpression(expression = '') {
    const parsedExpressions = parseChemistryExpression(expression);
    if (parsedExpressions.length < 1) return [];

    const firstParse = parsedExpressions.at(0).result;
    if (firstParse.type === 'error') {
        // If the first option is not an error a valid parse exists
        return {
            error: {
                offset: firstParse.loc[1] - 1,
                token: { value: firstParse.value }
            },
            message: `Unexpected token ${firstParse.value}`,
            stack: ""
        };
    }
    return parsedExpressions.map(convertToInequality);
}
