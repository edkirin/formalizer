const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');


// ********************************************************************************************************************


module.exports = {
    target: 'web',  // or 'node'
    entry: {
        formalizer: path.resolve(__dirname, './src/formalizer.js'),
    },
    output: {
        path: path.resolve(__dirname, './build'),
        filename: '[name].min.js',
        library: '[name]',  // global lib prefix
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true,
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
        modules: [
            path.resolve(__dirname, './js/src'),
            'node_modules',  // global imports
        ],
    },
    optimization: {
        minimizer: [
            new TerserJSPlugin({}),
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),  // clean build folder before build
    ],

    watchOptions: {
        ignored: /node_modules/
    },

    mode: 'development',
    devtool: 'source-map',
};


// ********************************************************************************************************************
