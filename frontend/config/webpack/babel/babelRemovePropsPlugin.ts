import { PluginItem } from '@babel/core';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export default function (): PluginItem {
    return {
        visitor: {
            Program(path: NodePath<t.Program>, state: any) {
                const forbidden = state.opts.props || [];

                path.traverse({
                    JSXIdentifier(current: NodePath<t.JSXIdentifier>) {
                        const nodeName = current.node.name;

                        if (forbidden.includes(nodeName)) {
                            current.parentPath.remove();
                        }
                    },
                });
            },
        },
    };
}
