const chemicalSymbol = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og'];
type ChemicalSymbol = typeof chemicalSymbol[number];

export type ParticleString = 'alphaparticle'|'betaparticle'|'gammaray'|'neutrino'|'antineutrino'|'electron'|'positron'|'neutron'|'proton';
type Type = 'error'|'particle'|'isotope'|'term'|'expr'|'statement'|'number';
type Result = Statement | Expression | Term | ParseError;

export type InequalityWidget = {
    type: string;
    properties?: any;
    children?: Array<InequalityWidget> | {};
    position?: { x: number, y: number };
    expression?: any;
}

export interface ASTNode extends InequalityWidget {
    type: Type;
}

interface ParseError extends ASTNode {
    type: 'error';
    value: string;
    expected: string[];
    loc: [number, number];
}
export function isParseError(node: InequalityWidget): node is ParseError {
    return node.type === 'error';
}

interface Particle extends ASTNode {
    type: 'particle';
    particle: ParticleString;
    mass: number;
    atomic: number;
}
export function isParticle(node: InequalityWidget): node is Particle {
    return node.type === 'particle';
}

interface Isotope extends ASTNode {
    type: 'isotope';
    element: ChemicalSymbol;
    mass: number;
    atomic: number;
}
export function isIsotope(node: InequalityWidget): node is Isotope {
    return node.type === 'isotope';
}

interface Term extends ASTNode {
    type: 'term';
    value: Isotope | Particle;
    coeff: number;
}
export function isTerm(node: InequalityWidget): node is Term {
    return node.type === 'term';
}

interface Expression extends ASTNode {
    type: 'expr';
    term: Term;
    rest?: Expression | Term;
}
export function isExpression(node: InequalityWidget): node is Expression {
    return node.type === 'expr';
}

interface Statement extends ASTNode {
    type: 'statement';
    left: Expression | Term;
    right: Expression | Term;
}
export function isStatement(node: InequalityWidget): node is Statement {
    return node.type === 'statement';
}

export interface NuclearAST {
    result: Result;
}

export type ParsingError = { error: { offset: number, token: { value: string } }, message: string, stack: string };

export type WidgetSpec = any;
