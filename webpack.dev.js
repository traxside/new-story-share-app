const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

// Create a base configuration without the Workbox plugin
const devConfig = merge(common, {
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
    hot: true,
    historyApiFallback: true,
  },
});

// Only add the Workbox plugin when not in watch mode
if (process.env.WEBPACK_WATCH !== 'true') {
  const { InjectManifest } = require('workbox-webpack-plugin');
  devConfig.plugins.push(
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/scripts/service-worker.js'),
      swDest: 'service-worker.js',
      exclude: [/\.hot-update\.(js|json)$/],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    })
  );
}

module.exports = devConfig;