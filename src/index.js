import parseMathsExpression from './parseMaths';
import parseBooleanExpression from './parseBool';
import parseChemistryExpression from './parseChem';
import parseNuclearExpression from './parseNuclear';
import parseInequalityChemistryExpression from './parseInequalityChem';
import parseInequalityNuclearExpression from './parseInequalityNuclear';

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
