import hljs from 'highlight.js'
import powershell from 'highlight.js/lib/languages/powershell'
hljs.registerLanguage('powershell', powershell)

export function highlight(code: string, lang: string): string {
		return hljs.highlight(code, { language: lang }).value
}