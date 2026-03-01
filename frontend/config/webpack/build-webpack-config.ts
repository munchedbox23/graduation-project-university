import TerserPlugin from "terser-webpack-plugin";
import { Configuration } from "webpack";

import { buildWebpackDevServer } from "./build-webpack-dev-server";
import { buildWebpackLoaders } from "./build-webpack-loaders";
import { buildWebpackPlugins } from "./build-webpack-plugins";
import { buildWebpackResolvers } from "./build-webpack-resolvers";
import type { IBuildOptions } from "./types";

export function buildWebpackConfig(options: IBuildOptions): Configuration {
  const { mode, paths, isDevelopment } = options;

  return {
    mode,
    entry: paths.entry,
    output: {
      filename: "[name].[contenthash].js",
      path: paths.build,
      clean: true,
      publicPath: "/",
      chunkFilename: "chunks/[name].[contenthash].js",
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({ extractComments: false })],
    },
    module: {
      rules: buildWebpackLoaders(options),
    },
    plugins: buildWebpackPlugins(options),
    resolve: buildWebpackResolvers(options),
    devServer: isDevelopment ? buildWebpackDevServer(options) : undefined,
    devtool: isDevelopment ? "eval-cheap-module-source-map" : undefined,
  };
}
