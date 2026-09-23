"""
HTML renderer for the project report.

Exposes exactly the same API as `docx_kit.Report`, so the content modules in
`content_*.py` drive either renderer without modification. This one emits a
single HTML document that Chrome paginates into a print-ready A4 PDF, which
gives three things the Word route cannot:

  * an exact page count, rather than an estimate;
  * a table of contents with real page numbers, resolved by rendering once,
    reading back which page each heading landed on, and rendering again;
  * identical output on any machine, since Chrome does the typesetting rather
    than whichever version of Word happens to open the file.
"""
import html
import pathlib
import re

BASE = pathlib.Path(__file__).parent

ACCENT = '#1f3b73'
GREY = '#444444'


def esc(text):
    return html.escape(str(text), quote=False)


def rich(text, mono_class='c'):
    """Renders the **bold** and `code` markers used throughout the content."""
    out = []
    for chunk in re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', str(text)):
        if not chunk:
            continue
        if chunk.startswith('**') and chunk.endswith('**'):
            out.append(f'<b>{esc(chunk[2:-2])}</b>')
        elif chunk.startswith('`') and chunk.endswith('`'):
            out.append(f'<code class="{mono_class}">{esc(chunk[1:-1])}</code>')
        else:
            out.append(esc(chunk))
    return ''.join(out)


class HtmlReport:
    """API-compatible with docx_kit.Report."""

    def __init__(self):
        self.parts = []
        self.figure_no = 0
        self.table_no = 0
        self.figures = []
        self.tables = []
        self.aux = False
        self.aux_figure_no = 0
        self.aux_table_no = 0
        self.headings = []       # (level, text, anchor) for the contents page
        self._anchor_seq = 0
        self.ref_index = {}      # populated from a first pass; see ref()

    # -- no-ops / page control ---------------------------------------------
    def add_page_numbers(self):
        pass

    def add_header_text(self, text):
        pass

    def page_break(self):
        self.parts.append('<div class="pagebreak"></div>')

    def spacer(self, points=8):
        self.parts.append(f'<div style="height:{points}px"></div>')

    def rule(self):
        self.parts.append('<hr class="rule">')

    def toc_field(self, levels='1-3'):
        # Filled in by build_print.py once the real page numbers are known.
        self.parts.append('<!--TOC-->')

    # -- headings -----------------------------------------------------------
    def _anchor(self, text):
        self._anchor_seq += 1
        slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:60]
        return f'h{self._anchor_seq}-{slug}'

    def _heading(self, level, text, page_break=False):
        anchor = self._anchor(text)
        if not self.aux:
            self.headings.append((level, text, anchor))
        cls = f'h{level}' + (' newpage' if page_break else '')
        self.parts.append(f'<h{level} id="{anchor}" class="{cls}">{esc(text)}</h{level}>')
        return anchor

    def h1(self, text, page_break=True):
        return self._heading(1, text, page_break)

    def h2(self, text):
        return self._heading(2, text)

    def h3(self, text):
        return self._heading(3, text)

    # -- text ---------------------------------------------------------------
    def p(self, text, justify=True, first_line_indent=True, spacing='double',
          italic=False, bold=False, size=12, align=None, space_after=0):
        classes = ['body']
        if spacing == 'single':
            classes.append('single')
        if first_line_indent and justify and align is None:
            classes.append('indent')
        if not justify:
            classes.append('noindent')
        style = []
        if size != 12:
            style.append(f'font-size:{size}pt')
        if space_after:
            style.append(f'margin-bottom:{space_after}pt')
        if italic:
            style.append('font-style:italic')
        if bold:
            style.append('font-weight:700')
        attr = f' style="{";".join(style)}"' if style else ''
        self.parts.append(f'<p class="{" ".join(classes)}"{attr}>{rich(text)}</p>')

    def centered(self, text, size=12, bold=False, italic=False, space_after=6,
                 caps=False, colour=None):
        style = [f'font-size:{size}pt', f'margin-bottom:{space_after}pt']
        if bold:
            style.append('font-weight:700')
        if italic:
            style.append('font-style:italic')
        if colour:
            style.append(f'color:{colour}')
        body = esc(text.upper() if caps else text)
        self.parts.append(f'<p class="centered" style="{";".join(style)}">{body}</p>')


    # -- symbolic cross-references -----------------------------------------
    # Prose refers to a figure or table by a distinctive fragment of its
    # caption rather than by a number. The number is resolved from the
    # registry built by a first pass, so inserting a figure in Chapter 3 can
    # never silently leave a stale "see Table 13" in Chapter 5. An unresolved
    # reference raises at build time instead of shipping.
    def ref(self, kind, caption_fragment):
        key = caption_fragment.lower()
        matches = [label for (k, cap), label in self.ref_index.items()
                   if k == kind and key in cap]
        if len(matches) == 1:
            return matches[0]
        if not self.ref_index:
            return f'{kind.capitalize()} ?'          # first pass
        if not matches:
            raise KeyError(f'cross-reference matches no {kind}: {caption_fragment!r}')
        raise KeyError(
            f'cross-reference is ambiguous for {kind} {caption_fragment!r} -> {matches}')

    def ref_table(self, caption_fragment):
        return self.ref('table', caption_fragment)

    def ref_figure(self, caption_fragment):
        return self.ref('figure', caption_fragment)

    def make_ref_index(self):
        """Caption -> label map, for feeding into the second pass."""
        index = {}
        for label, caption in self.figures:
            index[('figure', caption.lower())] = label
        for label, caption in self.tables:
            index[('table', caption.lower())] = label
        return index

    def right_text(self, text, size=11.5, bold=True):
        body = '<br>'.join(esc(line) for line in str(text).split('\n'))
        weight = '700' if bold else '400'
        self.parts.append(
            f'<p class="right" style="font-size:{size}pt;font-weight:{weight}">{body}</p>')

    def bullets(self, items, style='List Bullet', spacing='single'):
        tag = 'ol' if 'Number' in style else 'ul'
        rows = ''.join(f'<li>{rich(i)}</li>' for i in items)
        self.parts.append(f'<{tag} class="list">{rows}</{tag}>')

    def numbered(self, items, spacing='single'):
        self.bullets(items, style='List Number', spacing=spacing)

    # -- figures ------------------------------------------------------------
    def _fig_label(self):
        if self.aux:
            self.aux_figure_no += 1
            return f'Figure S{self.aux_figure_no}'
        self.figure_no += 1
        return f'Figure {self.figure_no}'

    def figure(self, filename, caption, width_inches=6.1, folder='diagrams'):
        label = self._fig_label()
        src = (BASE / folder / filename).as_uri()
        self.parts.append(
            f'<figure class="fig">'
            f'<img src="{src}" style="width:{width_inches}in">'
            f'<figcaption>{esc(label)}: {esc(caption)}</figcaption>'
            f'</figure>')
        if not self.aux:
            self.figures.append((label, caption))
        return label

    def screenshot(self, filename, caption, width_inches=6.1):
        return self.figure(filename, caption, width_inches, folder='screenshots')

    def figure_row(self, entries, folder='screenshots', gap_caption=None):
        cells, labels = [], []
        for filename, caption, width in entries:
            label = self._fig_label()
            labels.append(label)
            src = (BASE / folder / filename).as_uri()
            cells.append(
                f'<div class="figcell">'
                f'<img src="{src}" style="width:{width}in">'
                f'<div class="figcap">{esc(label)}: {esc(caption)}</div>'
                f'</div>')
            if not self.aux:
                self.figures.append((label, caption))
        self.parts.append(f'<div class="figrow">{"".join(cells)}</div>')
        return labels

    # -- tables -------------------------------------------------------------
    def table(self, headers, rows, caption=None, widths=None, font_size=9.5,
              header_fill='DCE3F0', zebra=True):
        if self.aux:
            self.aux_table_no += 1
            label = f'Table S{self.aux_table_no}'
        else:
            self.table_no += 1
            label = f'Table {self.table_no}'

        out = ['<div class="tablewrap">']
        if caption:
            out.append(f'<p class="tabcap">{esc(label)}: {esc(caption)}</p>')
            if not self.aux:
                self.tables.append((label, caption))

        colgroup = ''
        if widths:
            total = sum(widths)
            cols = ''.join(f'<col style="width:{w / total * 100:.2f}%">' for w in widths)
            colgroup = f'<colgroup>{cols}</colgroup>'

        head = ''.join(f'<th>{rich(h)}</th>' for h in headers)
        body = []
        for i, row in enumerate(rows):
            cls = ' class="zebra"' if (zebra and i % 2 == 1) else ''
            cells = ''.join(
                '<td>' + '<br>'.join(rich(seg) for seg in str(c).split('\n')) + '</td>'
                for c in row)
            body.append(f'<tr{cls}>{cells}</tr>')

        fill = header_fill if header_fill.startswith('#') else f'#{header_fill}'
        out.append(
            f'<table class="data" style="font-size:{font_size}pt">'
            f'{colgroup}<thead style="background:{fill}"><tr>{head}</tr></thead>'
            f'<tbody>{"".join(body)}</tbody></table>')
        out.append('</div>')
        self.parts.append(''.join(out))

    # -- code ---------------------------------------------------------------
    def code(self, text, caption=None, size=8.0, language=None):
        out = ['<div class="codewrap">']
        if caption:
            out.append(f'<p class="codecap">{esc(caption)}</p>')
        out.append(f'<pre class="code" style="font-size:{size}pt">{esc(text.rstrip())}</pre>')
        out.append('</div>')
        self.parts.append(''.join(out))

    # -- output -------------------------------------------------------------
    def render(self, title, css, header_text=''):
        return (
            '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>{esc(title)}</title><style>{css}</style></head>'
            f'<body>{"".join(self.parts)}</body></html>'
        )
