import parseMathsExpression from './parseMaths';
import parseBooleanExpression from './parseBool';

// This is now DEPRECATED and you should use parseMathsExpression instead.
const parseExpression = parseMathsExpression;

export { parseExpression, parseMathsExpression, parseBooleanExpression };