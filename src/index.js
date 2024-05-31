import parseMathsExpression from './parseMaths';
import parseBooleanExpression from './parseBool';
import parseChemistryExpression from './parseChem';
import parseNuclearExpression from './parseNuclear';

// This is now DEPRECATED and you should use parseMathsExpression instead.
const parseExpression = parseMathsExpression;

export {
    parseExpression,
    parseMathsExpression,
    parseBooleanExpression,
    parseChemistryExpression,
    parseNuclearExpression
};
