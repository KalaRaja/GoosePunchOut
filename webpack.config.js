const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: './src/main/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.ts'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/dist'),
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: './assets', to : 'assets' }
            ]
        })
    ]
};