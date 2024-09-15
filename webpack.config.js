const path = require('path')
const { merge } = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const common = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'json-object-diff',
      type: 'umd',
    },
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@/src': path.resolve(__dirname, 'src'),
    },
  },
  externals: {
    lodash: {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_',
    },
  },
  plugins: [new CleanWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.(t|j)s$/,
        exclude: [/node_modules/, /test/],
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: false,
              },
              target: 'es2015',
            },
            module: {
              type: 'es6',
            },
          },
        },
      },
    ],
  },
}

const dev = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: 'json-object-diff.js',
  },
})

const prod = merge(common, {
  mode: 'production',
  output: {
    filename: 'json-object-diff.min.js',
  },
  optimization: {
    minimize: true,
  },
})

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    return dev
  }
  return prod
}
