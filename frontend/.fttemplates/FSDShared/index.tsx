import { memo, type HTMLAttributes, type ReactNode } from "react";
import { Styled<FTName | pascalcase> } from "./styles";

interface IProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export const <FTName | pascalcase> = memo((props: IProps) => {
  const { children, className, ...restProps } = props;

  return (
    <Styled<FTName | pascalcase> className={className} {...restProps}>
      {children}
    </Styled<FTName | pascalcase>>
  );
});

<FTName | pascalcase>.displayName = "<FTName | pascalcase>";
