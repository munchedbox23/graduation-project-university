export type BuildMode = "development" | "production";

export interface IBuildPaths {
  src: string;
  html: string;
  public: string;
  entry: string;
  build: string;
  favicon: string;
  [key: string]: string;
}

export interface IBuildEnv {
  port: number;
  mode: BuildMode;
  apiUrl: string;
}

export interface IBuildOptions {
  mode: BuildMode;
  paths: IBuildPaths;
  isDevelopment: boolean;
  port: number;
  apiUrl: string;
}
