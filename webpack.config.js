var path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'inequality-grammar.js',
        library: 'inequality-grammar',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            { test: /\.ne$/, use: 'nearley-es6-loader' },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components|dist)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolveLoader: {
        modules: ['node_modules', path.resolve(__dirname, 'loaders')]
    }
};