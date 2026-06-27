import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { isLikelyHtml } from './isLikelyHtml'

const htmlToMarkdownProcessor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, {
    bulletOther: '-',
    emphasis: '_',
    strong: '*',
    rule: '-',
  })

export async function htmlToMarkdown(html: string): Promise<string> {
  const file = await htmlToMarkdownProcessor.process(html)
  return String(file).trim()
}

export type NormalizedImport = {
  markdown: string
  convertedFromHtml: boolean
}

export async function normalizeImportedContent(
  text: string,
): Promise<NormalizedImport> {
  if (!isLikelyHtml(text)) {
    return { markdown: text, convertedFromHtml: false }
  }

  const markdown = await htmlToMarkdown(text)
  return { markdown, convertedFromHtml: true }
}

export function importNotice(title: string, convertedFromHtml: boolean): string {
  if (convertedFromHtml) return `Opened ${title} (converted from HTML)`
  return `Opened ${title}`
}
