/**
 * Converts LaTeX resume code to HTML for live preview
 * Supports common resume LaTeX commands and produces A4-styled output
 */

interface LaTeXElement {
  type: 'section' | 'subheading' | 'item' | 'text' | 'link';
  content: string;
  extra?: Record<string, string>;
}

function parseLatex(latex: string): LaTeXElement[] {
  const elements: LaTeXElement[] = [];

  // Remove comments
  let cleaned = latex.replace(/%.*$/gm, '');

  // Extract document content
  const docMatch = cleaned.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/);
  if (!docMatch) return elements;

  const docContent = docMatch[1];

  // Split by \section{} or \section*{}
  // Match \section{...} or \section*{...}
  const sectionRegex = /\\section\*?\{([^}]*)\}/g;
  const sections: { title: string; content: string }[] = [];

  let lastMatch: RegExpExecArray | null = null;
  let lastIndex = 0;

  // First pass: find all section titles and their starting positions
  const sectionMatches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(docContent)) !== null) {
    sectionMatches.push(match);
  }

  // Build sections with their content
  for (let s = 0; s < sectionMatches.length; s++) {
    const currentMatch = sectionMatches[s];
    const nextMatch = sectionMatches[s + 1];
    const startOfContent = currentMatch.index + currentMatch[0].length;
    const endOfContent = nextMatch ? nextMatch.index : docContent.length;
    const sectionContent = docContent.substring(startOfContent, endOfContent);

    elements.push({
      type: 'section',
      content: currentMatch[1],
    });

    parseSectionContent(sectionContent, elements);
  }

  return elements;
}

function parseSectionContent(content: string, elements: LaTeXElement[]): void {
  // Remove itemize environments but keep items
  let cleaned = content
    .replace(/\\begin\{itemize\}/g, '')
    .replace(/\\end\{itemize\}/g, '')
    .trim();

  // Process \resumeSubheading{title}{date}{location}{details}
  const subheadingRegex = /\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g;
  const subheadings: { index: number; data: string[] }[] = [];
  let shMatch: RegExpExecArray | null;
  while ((shMatch = subheadingRegex.exec(cleaned)) !== null) {
    subheadings.push({
      index: shMatch.index,
      data: [shMatch[1], shMatch[2], shMatch[3], shMatch[4]],
    });
  }

  // Process items (\resumeItem{...})
  const itemRegex = /\\resumeItem\{([^}]*)\}/g;
  const items: { content: string; index: number }[] = [];
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemRegex.exec(cleaned)) !== null) {
    items.push({
      content: itemMatch[1],
      index: itemMatch.index,
    });
  }

  // Add subheadings first
  for (const sh of subheadings) {
    elements.push({
      type: 'subheading',
      content: sh.data[0],
      extra: {
        date: sh.data[1],
        location: sh.data[2],
        details: sh.data[3],
      },
    });
  }

  // Add items
  for (const item of items) {
    elements.push({
      type: 'item',
      content: item.content,
    });
  }

  // Process standalone text (for Summary, Name, Skills sections)
  const textContent = cleaned
    .replace(/\\resumeSubheading\{[^}]*\}\{[^}]*\}\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\resumeItem\{[^}]*\}/g, '')
    .replace(/\\begin\{[^}]*\}/g, '')
    .replace(/\\end\{[^}]*\}/g, '')
    .replace(/\\vspace\{[^}]*\}/g, '')
    .replace(/\\hspace\{[^}]*\}/g, '')
    .replace(/\\hfill/g, ' | ')
    .replace(/\\\\\s*/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('\\'));

  for (const line of textContent) {
    // Remove \textbf{}, \textit{}, \textsc{} wrappers but keep content
    const cleanLine = line
      .replace(/\\textbf\{([^}]*)\}/g, '$1')
      .replace(/\\textit\{([^}]*)\}/g, '$1')
      .replace(/\\textsc\{([^}]*)\}/g, '$1')
      .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
      .replace(/\\%/g, '%');

    if (cleanLine.length > 0) {
      elements.push({
        type: 'text',
        content: cleanLine,
      });
    }
  }

  // Process \href commands separately (they might have been replaced above)
  const hrefRegex = /\\href\{([^}]*)\}\{([^}]*)\}/g;
  let hrefMatch: RegExpExecArray | null;
  while ((hrefMatch = hrefRegex.exec(content)) !== null) {
    elements.push({
      type: 'link',
      content: hrefMatch[2],
      extra: { href: hrefMatch[1] },
    });
  }
}

/**
 * Convert LaTeX code to styled HTML
 */
export function latexToHtml(latex: string): string {
  const elements = parseLatex(latex);

  if (elements.length === 0) {
    return '<div class="a4-page"><p style="color:#999;text-align:center;padding:40px 20px;">Edit the LaTeX code to see your preview appear here.</p></div>';
  }

  let html = '';

  for (const el of elements) {
    switch (el.type) {
      case 'section':
        html += `<div class="section-heading">${escapeHtml(el.content)}</div>`;
        break;

      case 'subheading':
        const date = el.extra?.date || '';
        const location = el.extra?.location || '';
        const details = el.extra?.details || '';
        html += `
          <div class="subheading">
            <div class="subheading-row">
              <span class="subheading-title">${escapeHtml(el.content)}</span>
              <span class="subheading-date">${escapeHtml(date)}</span>
            </div>
            ${location || details ? `<div class="subheading-row">
              <span class="subheading-location"><em>${escapeHtml(location)}</em></span>
              <span class="subheading-details">${escapeHtml(details)}</span>
            </div>` : ''}
          </div>`;
        break;

      case 'item':
        html += `<div class="resume-item">${escapeBullet(escapeHtml(el.content))}</div>`;
        break;

      case 'text':
        // Check if it's a contact info line (contains | or @)
        if ((el.content.includes('|') || el.content.includes('@')) && el.content.includes(' | ')) {
          const parts = el.content.split('|').map(s => s.trim()).filter(Boolean);
          html += `<div class="contact-line">${parts.map(escapeHtml).join('<span class="separator"> | </span>')}</div>`;
        } else {
          html += `<div class="text-line">${escapeHtml(el.content)}</div>`;
        }
        break;

      case 'link':
        const href = el.extra?.href || '#';
        html += `<a href="${escapeHtml(href)}" class="resume-link">${escapeHtml(el.content)}</a>`;
        break;
    }
  }

  return wrapInDocument(html);
}

function escapeBullet(text: string): string {
  // Handle escaped percent signs
  return text.replace(/^•\s*/, '');
}

function wrapInDocument(content: string): string {
  return `<div class="a4-page">
<style>
.a4-page {
  width: 100%;
  max-width: 794px;
  min-height: 1123px;
  padding: 48px 56px;
  margin: 0 auto;
  background: white;
  font-family: 'Latin Modern Roman', 'Times New Roman', Times, serif;
  font-size: 11pt;
  line-height: 1.4;
  color: #000;
  box-sizing: border-box;
}

.section-heading {
  font-weight: bold;
  font-size: 13pt;
  text-transform: uppercase;
  margin-top: 14px;
  margin-bottom: 8px;
  padding-bottom: 3px;
  border-bottom: 1px solid #000;
  letter-spacing: 0.5px;
  color: #000;
}

.subheading {
  margin-bottom: 2px;
  margin-top: 6px;
}
.subheading-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
}
.subheading-title {
  font-weight: bold;
  font-size: 11pt;
}
.subheading-date {
  font-size: 10pt;
  color: #444;
}
.subheading-location {
  font-style: italic;
  font-size: 10pt;
  color: #444;
}
.subheading-details {
  font-size: 10pt;
  color: #444;
}

.resume-item {
  margin: 2px 0;
  padding-left: 16px;
  position: relative;
  font-size: 10.5pt;
}
.resume-item::before {
  content: '\\2022';
  position: absolute;
  left: 0;
}

.text-line {
  margin: 4px 0;
  font-size: 10.5pt;
}
.contact-line {
  margin: 2px 0;
  font-size: 10pt;
  color: #333;
}
.contact-line .separator {
  color: #888;
}

.resume-link {
  color: #0000EE;
  text-decoration: underline;
  font-size: 10pt;
}
</style>
${content}
</div>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
