const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
        warnings: false, // Set to false to avoid overlay for workbox warnings
      },
    },
    devMiddleware: {
      writeToDisk: true,
    },
    hot: true,
    historyApiFallback: true,
  },
  plugins: [
    // Always include the service worker in development
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/scripts/service-worker.js'),
      swDest: 'service-worker.js',
      exclude: [/\.hot-update\.(js|json)$/],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    }),
    // Create a minimal fallback offline page
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          // This ensures an offline fallback page is available
          from: path.resolve(__dirname, 'src/offline.html'),
          to: path.resolve(__dirname, 'dist/'),
          noErrorOnMissing: true, // Don't error if file doesn't exist yet
        },
      ],
    }),
  ],
  ignoreWarnings: [
    warning =>
      typeof warning.message === 'string' &&
      warning.message.includes('InjectManifest has been called multiple times')
  ]
});