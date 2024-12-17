import parseMathsExpression from './parseMaths.js';
import parseBooleanExpression from './parseBool.js';
import parseChemistryExpression from './parseChem.js';
import parseNuclearExpression from './parseNuclear.ts';
import parseInequalityChemistryExpression from './parseInequalityChem.js';
import parseInequalityNuclearExpression from './parseInequalityNuclear.ts';

// This is now DEPRECATED and you should use parseMathsExpression instead.
const parseExpression = parseMathsExpression;

export {
    parseExpression,
    parseMathsExpression,
    parseBooleanExpression,
    parseChemistryExpression,
    parseNuclearExpression,
    parseInequalityChemistryExpression,
    parseInequalityNuclearExpression
};
