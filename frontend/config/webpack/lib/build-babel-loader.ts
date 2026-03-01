import babelRemovePropsPlugin from "../babel/babelRemovePropsPlugin";
import type { IBuildOptions } from "../types";

export function buildBabelLoader({
  isDevelopment,
}: IBuildOptions) {
  return {
    test: /\.(js|jsx|ts|tsx)$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                browsers: ["> 1%", "last 2 versions"],
                node: "current",
              },
              useBuiltIns: "entry",
              corejs: 3,
              modules: false,
            },
          ],
          [
            "@babel/preset-react",
            {
              runtime: "automatic",
            },
          ],
          "@babel/preset-typescript",
        ],
        plugins: [
          ["babel-plugin-styled-components"],
          !isDevelopment && [babelRemovePropsPlugin, { props: ["data-testid"] }],
          [
            "@babel/plugin-transform-runtime",
            {
              regenerator: true,
            },
          ],
          isDevelopment && require.resolve("react-refresh/babel"),
        ].filter(Boolean),
      },
    },
  };
}
