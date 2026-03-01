import MiniCssExtractPlugin from "mini-css-extract-plugin";
import type { RuleSetRule } from "webpack";

import { buildBabelLoader } from "./lib";
import type { IBuildOptions } from "./types";

export function buildWebpackLoaders(options: IBuildOptions): RuleSetRule[] {
  const { isDevelopment } = options;

  const svgLoader = {
    test: /\.svg$/,
    use: ["@svgr/webpack"],
  };

  const babelLoader = buildBabelLoader(options);

  const cssLoader = {
    test: /\.css$/i,
    use: [
      isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
      {
        loader: "css-loader",
        options: {
          modules: {
            auto: (resPath: string) => Boolean(resPath.includes(".module.")),
            localIdentName: isDevelopment ? "[path][name]__[local]--[hash:base64:5]" : "[hash:base64:8]",
          },
        },
      },
    ],
  };

  const fileLoader = {
    test: /\.(png|jpe?g|gif|woff2|woff)$/i,
    use: [
      {
        loader: "file-loader",
      },
    ],
  };

  return [fileLoader, svgLoader, babelLoader, cssLoader];
}
