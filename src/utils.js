import _cloneDeep from 'lodash/cloneDeep'
import _isEmpty from 'lodash/isEmpty'
import _isEqual from 'lodash/isEqual'
import _map from 'lodash/map'
import _mapValues from 'lodash/mapValues'
import _omit from 'lodash/omit'
import _reduceRight from 'lodash/reduceRight'

export const _rightChainToArray = (node) => {
    let n = node
    let a = [n]
    while (n.children.right) {
        n = n.children.right
        a = [...a, n]
    }
    return a
}

export const _findRightmost = (node) => {
    let n = node
    while (n.children.right) {
        n = n.children.right
    }
    return n
}

export const _safeToRemove = (node) => {
    return node && node.type === 'Brackets' && _isEmpty(_omit(node.children, 'argument'))
}

export const _simplify = (node) => {
    node.children = _mapValues(node.children, (v, k, c) => _simplify(v))

    if (node.type === 'Brackets' || node.type === 'Fn') {
        let argument = node.children.argument
        if (_safeToRemove(argument)) {
            node.children.argument = argument.children.argument
        }
    }
    if (node.type === 'Fraction') {
        let numerator = node.children.numerator
        if (_safeToRemove(numerator)) {
            node.children.numerator = numerator.children.argument
        }
        let denominator = node.children.denominator
        if (_safeToRemove(denominator)) {
            node.children.denominator = denominator.children.argument
        }
    }
    let superscript = node.children.superscript
    if (_safeToRemove(superscript)) {
        node.children.superscript = superscript.children.argument
    }
    return node
}