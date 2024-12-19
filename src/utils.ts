import _cloneDeep from 'lodash/cloneDeep';
import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';
import _map from 'lodash/map';
import _mapValues from 'lodash/mapValues';
import _omit from 'lodash/omit';
import _reduceRight from 'lodash/reduceRight';
import { InequalityWidget } from './types';

/**
 * Turns a chain of right-bound WidgetSpecs into an array.
 * 
 * @param {InequalityWidget} node 
 * @returns {InequalityWidget[]}
 */
export const _rightChainToArray = (node: InequalityWidget) => {
    let n = node
    let a = [n]
    while (n.children && n.children.right) {
        n = n.children.right
        a = [...a, n]
    }
    return a
}

/**
 * Finds the last WidgetSpec going down the "right"-chain of children in an Inequality AST
 * @param {InequalityWidget} node 
 * @returns {InequalityWidget}
 */
export const _findRightmost = (node: InequalityWidget) => {
    let n = node
    while (n.children && n.children.right) {
        n = n.children.right
    }
    return n
}

/**
 * Checks if a node is just an empty set of brackets.
 * 
 * @param {InequalityWidget} node 
 * @returns True if the node is an empty set of brackets.
 */
export const _safeToRemove = (node: InequalityWidget) => {
    return node && node.type === 'Brackets' && _isEmpty(_omit(node.children, 'argument'))
}

/**
 * Attempts to simplify expressions where extra unnecessary brackets have been generated.
 * 
 * @param {InequalityWidget} node - A subtree to simplify.
 * @returns The simplified node.
 */
export const _simplify = (node: InequalityWidget) => {
    node.children = _mapValues(node.children, (v, k, c) => _simplify(v))

    if (node.type === 'Brackets' || node.type === 'Fn') {
        let argument = node.children.argument
        if (_safeToRemove(argument) && argument.children) {
            node.children.argument = argument.children.argument
        }
    }
    if (node.type === 'Fraction') {
        let numerator = node.children.numerator
        if (_safeToRemove(numerator) && numerator.children) {
            node.children.numerator = numerator.children.argument
        }
        let denominator = node.children.denominator
        if (_safeToRemove(denominator) && denominator.children) {
            node.children.denominator = denominator.children.argument
        }
    }
    let superscript = node.children.superscript
    if (_safeToRemove(superscript) && superscript.children) {
        node.children.superscript = superscript.children.argument
    }
    return node
}
