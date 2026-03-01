import path from "path";
import type { ResolveOptions } from "webpack";

import type { IBuildOptions } from "./types";

export function buildWebpackResolvers(options: IBuildOptions): ResolveOptions {
  const { paths } = options;

  return {
    modules: ["node_modules", paths.src],
    mainFiles: ["index"],
    preferAbsolute: true,
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": path.resolve(paths.src),
      "@app": path.resolve(paths.src, "app"),
      "@entities": path.resolve(paths.src, "entities"),
      "@pages": path.resolve(paths.src, "pages"),
      "@features": path.resolve(paths.src, "features"),
      "@widgets": path.resolve(paths.src, "widgets"),
      "@shared": path.resolve(paths.src, "shared"),
    },
  };
}
