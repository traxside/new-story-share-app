const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devtool: 'inline-source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    devMiddleware: {
      writeToDisk: true,
    },
    // hot module replacement configuration
    hot: true,
    historyApiFallback: true,
  },
});