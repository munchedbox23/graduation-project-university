import type { Configuration as DevServerConfiguration } from "webpack-dev-server";

import type { IBuildOptions } from "./types";

export function buildWebpackDevServer(options: IBuildOptions): DevServerConfiguration {
  const { paths, port } = options;

  return {
    port,
    hot: true,
    compress: true,
    historyApiFallback: true,
    static: paths.public,
    open: true,
  };
}
