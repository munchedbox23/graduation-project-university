declare const __IS_DEV__: boolean;
declare const __API_URL__: string;
declare const __API_SERVICE_URL__: string;

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";

declare module "*.module.css" {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare module "*.css" {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare module "*.svg" {
  import React from "react";
  const SVG: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}
