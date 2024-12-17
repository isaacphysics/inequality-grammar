import parseNuclear from "./parseNuclear";
import { _findRightmost, _simplify } from "./utils";

let _window: Window | { innerWidth: number, innerHeight: number };
try {
    _window = window;
} catch (error) {
    _window = { innerWidth: 800, innerHeight: 600 };
}

const chemicalSymbol = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og'];
type ChemicalSymbol = typeof chemicalSymbol[number];

export type ParticleString = 'alphaparticle'|'betaparticle'|'gammaray'|'neutrino'|'antineutrino'|'electron'|'positron'|'neutron'|'proton';
export type Type = 'error'|'particle'|'isotope'|'term'|'expr'|'statement';
export type Result = Statement | Expression | Term | ParseError;

export interface ASTNode {
    type: Type;
}

export interface ParseError extends ASTNode {
    type: 'error';
    value: string;
    expected: string[];
    loc: [number, number];
}
export function isParseError(node: ASTNode): node is ParseError {
    return node.type === 'error';
}

export interface Particle extends ASTNode {
    type: 'particle';
    particle: ParticleString;
    mass: number;
    atomic: number;
}
export function isParticle(node: ASTNode): node is Particle {
    return node.type === 'particle';
}

export interface Isotope extends ASTNode {
    type: 'isotope';
    element: ChemicalSymbol;
    mass: number;
    atomic: number;
}
export function isIsotope(node: ASTNode): node is Isotope {
    return node.type === 'isotope';
}

export interface Term extends ASTNode {
    type: 'term';
    value: Isotope | Particle;
    coeff: number;
    isParticle: boolean;
}
export function isTerm(node: ASTNode): node is Term {
    return node.type === 'term';
}

export interface Expression extends ASTNode {
    type: 'expr';
    term: Term;
    rest?: Expression | Term;
}
export function isExpression(node: ASTNode): node is Expression {
    return node.type === 'expr';
}

export interface Statement extends ASTNode {
    type: 'statement';
    left: Expression | Term;
    right: Expression | Term;
}
export function isStatement(node: ASTNode): node is Statement {
    return node.type === 'statement';
}

export interface NuclearAST {
    result: Result;
}

function convertNode<T extends ASTNode>(node: T): any {
    switch(node.type) {
        case 'statement': {
            if(isStatement(node)) {
                let lhs: Term | Expression = convertNode(node.left);
                const rhs: Term | Expression = convertNode(node.right);
                const statement = {
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
                    const expression = {
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
                const children: { mass_number?: any, proton_number?: any } = {}
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

                const children: { mass_number?: any, proton_number?: any, superscript?: any } = {}
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
            return {};
        }
    }
}

function convertToInequality(ast: { result: any; }) {
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
