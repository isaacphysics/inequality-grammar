import parseMathsExpression from './parseMaths.js';
import parseBooleanExpression from './parseBool.js';
export { parseChemistryExpression } from './parseChem';
export { parseNuclearExpression } from './parseNuclear';
export { parseInequalityChemistryExpression } from './parseInequalityChem';
export { parseInequalityNuclearExpression } from './parseInequalityNuclear';
export { ParsingError } from './types';

// This is now DEPRECATED and you should use parseMathsExpression instead.
const parseExpression = parseMathsExpression;

export {
    parseExpression,
    parseMathsExpression,
    parseBooleanExpression,
};
