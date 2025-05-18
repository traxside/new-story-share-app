const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      meta: {
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
        'theme-color': '#777',
        description: 'A progressive web app for reading and sharing stories',
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
        // Make sure manifest.json is copied to dist
        {
          from: path.resolve(__dirname, 'manifest.json'),
          to: path.resolve(__dirname, 'dist/'),
        },
      ],
    }),
    // InjectManifest
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/scripts/service-worker.js'),
      swDest: 'service-worker.js',
      // Exclude hot update files
      exclude: [/\.hot-update\.(js|json)$/],
    }),
  ],
};