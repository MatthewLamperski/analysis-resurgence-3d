const CopyPlugin = require('copy-webpack-plugin');
const chmodr = require('chmodr')
const path = require("path");

class PermissionsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("PermissionsPlugin", () => {
      chmodr(path.join(__dirname, './.webpack/main/python'), 0o755, err => {
        if (err) {
          console.log("Error changing exe perms " + err)
        }
      })
      console.log("changing permissions", path.join(__dirname, './.webpack/main/python'), __dirname)
    })
  }
}

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
    new PermissionsPlugin(),
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
