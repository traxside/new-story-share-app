const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { InjectManifest } = require('workbox-webpack-plugin');

// Create a base configuration
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

// Only add the InjectManifest plugin in production or explicitly when building
if (process.env.NODE_ENV === 'production' || process.env.BUILD_SW === 'true') {
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