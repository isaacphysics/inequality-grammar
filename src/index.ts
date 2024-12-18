import parseMathsExpression from './parseMaths.js';
import parseBooleanExpression from './parseBool.js';
import parseChemistryExpression from './parseChem.js';
export { parseNuclearExpression } from './parseNuclear';
import parseInequalityChemistryExpression from './parseInequalityChem.js';
export { parseInequalityNuclearExpression } from './parseInequalityNuclear';
import { ParsingError } from './types';

// This is now DEPRECATED and you should use parseMathsExpression instead.
const parseExpression = parseMathsExpression;

export {
    parseExpression,
    parseMathsExpression,
    parseBooleanExpression,
    parseChemistryExpression,
    parseInequalityChemistryExpression,
    ParsingError,
};
