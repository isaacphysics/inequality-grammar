import parseNuclear from "./parseNuclear";
import { InequalityWidget, isTerm, isIsotope, isParticle, isStatement, isExpression, NuclearAST } from "./types";
import { _findRightmost, _simplify } from "./utils";

let _window: Window | { innerWidth: number, innerHeight: number };
try {
    _window = window;
} catch (error) {
    _window = { innerWidth: 800, innerHeight: 600 };
}

function convertNode<T extends InequalityWidget>(node: T): InequalityWidget {
    switch(node.type) {
        case 'statement': {
            if(isStatement(node)) {
                let lhs = convertNode(node.left);
                const rhs = convertNode(node.right);
                const statement: InequalityWidget = {
                    type: 'Relation',
                    properties: { relation: 'rightarrow' },
                    children: { right: rhs }
                }

                const rightMost = _findRightmost(lhs);
                rightMost.children['right'] = statement;
                lhs = _simplify(lhs);

                return { ...lhs };
            }
        }
        case 'expr': {
            if(isExpression(node)) {
                let lhs = convertNode(node.term);
                if (node.rest) {
                    const rhs = convertNode(node.rest);
                    const expression: InequalityWidget = {
                        type: 'BinaryOperation',
                        properties: { operation: '+' },
                        children: { right: rhs }
                    }

                    const rightMost = _findRightmost(lhs);
                    rightMost.children['right'] = expression;
                }

                return { ...lhs };
            }
        }
        case 'term': {
            if(isTerm(node)) {
                const value = convertNode(node.value);
                let lhs = node.coeff !== 1
                ? { type: 'Num', properties: { significand: node.coeff.toString() }, children: { right: value } }
                : value;

                return lhs;
            }
        }
        case 'isotope': {
            if(isIsotope(node)) {
                const children: { mass_number?: InequalityWidget, proton_number?: InequalityWidget } = {}
                if (node.mass !== null) {
                    children.mass_number = {
                        type: 'Num',
                        properties: { significand: node.mass.toString() },
                        children: {}
                    }
                }
                if (node.atomic !== null) {
                    children.proton_number = {
                        type: 'Num',
                        properties: { significand: node.atomic.toString() },
                        children: {}
                    }
                }

                return {
                    type: 'ChemicalElement',
                    properties: { element: node.element },
                    children: children
                }
            }
        }
        case 'particle': {
            if(isParticle(node)) {
                let particle: string;
                switch (node.particle) {
                    case 'alphaparticle':
                        particle = 'alpha';
                        break;
                    case 'betaparticle':
                        particle = 'beta';
                        break;
                    case 'gammaray':
                        particle = 'gamma';
                        break;
                    case 'positron':
                        particle = 'beta';
                        break;
                    default:
                        particle = node.particle; 
                        break;
                }

                const children: { mass_number?: InequalityWidget, proton_number?: InequalityWidget, superscript?: InequalityWidget } = {}
                if (node.mass !== null)  {
                    children.mass_number = {
                        type: 'Num',
                        properties: { significand: node.mass.toString() },
                        children: {}
                    }
                }
                if (node.atomic !== null)  {
                    children.proton_number = {
                        type: 'Num',
                        properties: { significand: node.atomic.toString() },
                        children: {}
                    }
                }

                const lhs = {
                    type: 'Particle',
                    properties: { type: particle },
                    children: children
                }

                if (node.particle === 'positron') {
                    lhs.children['superscript'] = {
                        type: 'BinaryOperation',
                        properties: { operation: '+' },
                        children: {}
                    }
                }

                return lhs;
            }
        }
        default: {
            console.error("Unknown type:", node.type);
            return { type: "error", properties: {} };
        }
    }
}

function convertToInequality(ast: NuclearAST) {
    const inequalityAST = convertNode(ast.result);
    inequalityAST.position = { x: _window.innerWidth/4, y: _window.innerHeight/3 }
    inequalityAST.expression = { latex: "", python: "" }
    return _simplify(inequalityAST);
}

export default function(expression = '') {
    const parsedExpressions = parseNuclear(expression);
    if (parsedExpressions.length < 1) return [];

    const firstParse = parsedExpressions.at(0)?.result;
    if (firstParse?.type === 'error') {
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
