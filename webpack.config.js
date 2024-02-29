var path = require('path');

module.exports = (_env, argv) => { return {
    entry: './src/index.js',
    devtool: argv.mode === 'development' ? 'eval-source-map' : false,
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'inequality-grammar.js',
        globalObject: 'this',
        library: {
            name: 'inequality-grammar',
            type: 'umd'
        }
    },
    module: {
        rules: [
            {
                test: /\.ne$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    },
                    'nearley-es6-loader'
                ]
            },
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
}};
