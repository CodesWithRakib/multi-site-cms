# Content Rendering & AST Transformation

## 1. Overview & Security Posture

Editorial content in `multi-site-cms` is created using a headless Tiptap editor and stored canonically as a structured ProseMirror JSON Abstract Syntax Tree (AST).

The Travel Blog frontend prohibits the use of `dangerouslySetInnerHTML` for editorial content bodies. Instead, it processes the AST via `DocRenderer` (`src/components/content/DocRenderer.tsx`), transforming structured JSON nodes directly into type-safe, accessible React components.

### Security Guarantees

1. **Zero Raw HTML Injection**: Malicious HTML tags (e.g. `<script>`, `<iframe src="evil.com">`, `<object>`) stored in untrusted fields cannot execute because every node is rendered using strict React JSX primitives.
2. **Protocol Whitelisting**:
   - Links and media references validate URI schemes against an allowlist (`http:`, `https:`, `mailto:`, `tel:`).
   - Exploitable schemes such as `javascript:`, `data:`, and `vbscript:` are sanitized to empty strings, rendering malicious anchors harmless.
3. **Tabnabbing Protection**: External links automatically receive `target="_blank"` and `rel="noopener noreferrer"`.

---

## 2. DocRenderer Architecture

```
                    ┌────────────────────────────┐
                    │    ProseMirror JSON AST    │
                    │   { type: 'doc', content } │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │        DocRenderer         │
                    │   Recursive Node Walker    │
                    └─────────────┬──────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ Standard DOM │            │ Media & Embed│            │ Custom Ext.  │
│  h1-h6, p,   │            │  next/image, │            │ Destination  │
│ blockquote,  │            │  YouTube     │            │ Info Block,  │
│ lists, table │            │  embeds      │            │ Callouts     │
└──────────────┘            └──────────────┘            └──────────────┘
```

---

## 3. Node Type Specifications

### 3.1 Headings & Anchor Links

- Headings (`heading` with `attrs.level` 1–6) compute a deterministic anchor ID from their text content.
- Generates deep-linking targets allowing readers to share direct section links.
- Uses semantic HTML (`<h2>`, `<h3>`, `<h4>`) styled with responsive editorial typography.

### 3.2 Rich Typography

- `paragraph`: Standard paragraph with relaxed line height and inline mark rendering.
- `blockquote`: Editorial quote with a prominent left border, serif font, and italic styling.
- `codeBlock`: Code blocks with dark styling and monospace formatting.
- `bulletList` & `orderedList`: Accessible list structures with custom bullet styling.
- `table`: Rendered inside a responsive horizontal-scroll container with bordered headers and alternating rows.

### 3.3 Media & Embedded Content

- `image`: Rendered using Next.js `<Image>` with intrinsic dimensions (`attrs.width`, `attrs.height`) or responsive flex layouts, including `attrs.alt` and figcaption captions.
- `youtube`: Responsive 16:9 container wrapping an iframe with restricted capabilities (`allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`).

### 3.4 Custom Domain Extensions

#### Destination Info Block (`destinationInfoBlock`)

Structured block containing essential travel facts:

- Country / Region
- Best Season to Visit
- Local Currency
- Spoken Languages
- Transportation Advice

Rendered as a premium travel badge card with icons and metadata chips.

#### Callout (`callout`)

Editorial aside rendered in contextual colors:

- `info`: Blue tinted card for contextual notes.
- `warning`: Amber tinted card for safety advisories or visa requirements.
- `tip`: Emerald tinted card for insider recommendations.

---

## 4. Unsupported & Unknown Node Handling

If an article contains an unsupported or experimental AST node:

1. The walker skips the unknown container without throwing a runtime error.
2. In development mode, a console warning highlights the unrecognized node type.
3. The rest of the document continues to render cleanly without hydration mismatch or page disruption.
