import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import rehypeReact from 'rehype-react'
import rehypeStringify from 'rehype-stringify'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { ReactElement } from 'react'
import { remarkSourceLine } from './remarkSourceLine'

function createBaseProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSourceLine)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeHighlight)
    .use(rehypeSanitize)
}

const reactProcessor = createBaseProcessor().use(rehypeReact, {
  Fragment,
  jsx,
  jsxs,
  development: false,
  production: { Fragment, jsx, jsxs },
})

const htmlProcessor = createBaseProcessor().use(rehypeStringify)

export async function renderMarkdownToReact(
  markdown: string,
): Promise<ReactElement> {
  const file = await reactProcessor.process(markdown)
  return file.result as ReactElement
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const file = await htmlProcessor.process(markdown)
  return String(file)
}
