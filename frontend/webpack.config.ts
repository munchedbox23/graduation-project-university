import dotenv from "dotenv";
import path from "path";
import type { Configuration } from "webpack";

import { buildWebpackConfig } from "./config/webpack";
import type { IBuildEnv, IBuildPaths } from "./config/webpack";

export default (env: IBuildEnv) => {


  dotenv.config({ path: path.resolve(__dirname, ".env") });

  const mode = env.mode || process.env.NODE_ENV || "development";
  const PORT = env?.port ?? process.env.PORT ?? "3001";
  const API_URL = env?.apiUrl || process.env.API_SERVICE_URL

  const paths: IBuildPaths = {
    src: path.resolve(__dirname, "src"),
    entry: path.resolve(__dirname, "src", "index.tsx"),
    build: path.resolve(__dirname, "build"),
    public: path.resolve(__dirname, "public"),
    html: path.resolve(__dirname, "public", "index.html"),
    favicon: path.resolve(__dirname, "public", "favicon.ico"),
  };

  const config: Configuration = buildWebpackConfig({
    mode,
    port: PORT,
    apiUrl: API_URL!,
    paths,
    isDevelopment: mode === "development",
  });

  return config;
};
