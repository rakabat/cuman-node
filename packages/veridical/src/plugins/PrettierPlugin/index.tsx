import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { format } from 'prettier/standalone';
import { $getSelection, $isRangeSelection } from 'lexical';
import { $isCodeNode } from '@lexical/code';
import babelParser from 'prettier/parser-babel';
import htmlParser from 'prettier/parser-html';
import markdownParser from 'prettier/parser-markdown';
import cssParser from 'prettier/parser-postcss';
import { Plugin, Options } from 'prettier';
import { LexicalEditor } from 'lexical';

interface IParser {
    lang: string[];
    parser: string;
    plugins: (string | Plugin<any>)[] | undefined;
}

const PARSERS: IParser[] = [
    {
        lang: ['javascript', 'typescript', 'js', 'ts'],
        parser: 'babel',
        plugins: [babelParser],
    },
    {
        lang: ['html'],
        parser: 'html',
        plugins: [htmlParser],
    },
    {
        lang: ['css', 'scss'],
        parser: 'css',
        plugins: [cssParser],
    },
    {
        lang: ['markdown'],
        parser: 'markdown',
        plugins: [markdownParser],
    },
];

function getOptions(language: string | null | undefined): Options | undefined {
    if (!language) return;

    const parser = PARSERS.find((parser) => {
        return parser.lang.includes(language);
    });

    if (!parser) return;

    return {
        parser: parser.parser,
        plugins: parser.plugins,
    };
}

function usePrettierPlugin(
    editor: LexicalEditor,
    isKeydown: (ev: KeyboardEvent) => boolean,
) {
    useEffect(() => {
        function prettierCommandListener(ev: KeyboardEvent) {
            if (isKeydown(ev)) {
                ev.preventDefault();
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;

                    const selectionNode = selection.getNodes()[0];
                    const parentNode = selectionNode.getParent();

                    if ($isCodeNode(parentNode)) {
                        const codeNode = parentNode;
                        const language = codeNode.getLanguage();
                        const prettierOptions = getOptions(language);

                        if (!prettierOptions) return;

                        let textContent = codeNode.getTextContent();
                        try {
                            textContent = format(textContent, prettierOptions);
                        } catch (error) {
                            /* empty */
                        }
                        const codeSelection = codeNode.select(0);
                        codeSelection.insertText(textContent);
                    }
                });
            }
        }
        document.addEventListener('keydown', prettierCommandListener);

        return () =>
            document.removeEventListener('keydown', prettierCommandListener);
    }, [editor, isKeydown]);

    return null;
}

function defaultIsKeydown(ev: KeyboardEvent) {
    if (ev.altKey && ev.shiftKey && ev.key == 'F') {
        return true;
    }
    return false;
}

export default function PrettierPlugin({
    isKeydown = defaultIsKeydown,
}: {
    isKeydown?: (ev: KeyboardEvent) => boolean;
}) {
    const [editor] = useLexicalComposerContext();
    return usePrettierPlugin(editor, isKeydown);
}
