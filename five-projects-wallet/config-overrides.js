const webpack = require("webpack");

module.exports = function override(config, env) {
  (config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    assert: require.resolve("assert/"),
    buffer: require.resolve("buffer/"),
    path: require.resolve("path-browserify"),
    fs: false,
  }),
    (config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
    ]);

  return config;
};
