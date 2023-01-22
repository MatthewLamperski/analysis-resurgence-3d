const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new CopyPlugin({
      options: {},
      patterns: [
        {
          from: './src/python/dist/analyze',
          to: 'python',
        }
      ]
    })
  ]
};
