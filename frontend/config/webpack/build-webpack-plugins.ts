import CircularDependencyPlugin from "circular-dependency-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack, { WebpackPluginInstance } from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";

import type { IBuildOptions } from "./types";

export function buildWebpackPlugins(options: IBuildOptions): WebpackPluginInstance[] {
  const { isDevelopment, paths, apiUrl, mode } = options;
  const isProduction = !isDevelopment;

  const plugins: WebpackPluginInstance[] = [
    new HtmlWebpackPlugin({
      template: paths.html,
      favicon: paths.favicon,
    }),
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      __IS_DEV__: JSON.stringify(isDevelopment),
      __API_URL__: JSON.stringify(apiUrl),
      __API_SERVICE_URL__: JSON.stringify(process.env.API_SERVICE_URL),
      "process.env.NODE_ENV": JSON.stringify(mode),
    }),
  ];

  if (isDevelopment) {
    plugins.push(
      new ReactRefreshWebpackPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        analyzerMode: "disabled",
      }),
      new CircularDependencyPlugin({
        exclude: /node_modules/,
        failOnError: true,
      }),
      new ForkTsCheckerWebpackPlugin({
        issue: {
          include: [{ file: "**/src/**/*" }],
          exclude: [{ file: "**/*.spec.ts" }],
        },
        typescript: {
          diagnosticOptions: {
            semantic: true,
            syntactic: true,
          },
          mode: "write-references",
        },
      }),
    );
  }

  if (isProduction) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: "css/[name].[hash:8].css",
        chunkFilename: "css/[name].[hash:8].css",
      }),
    );
  }

  return plugins;
}
