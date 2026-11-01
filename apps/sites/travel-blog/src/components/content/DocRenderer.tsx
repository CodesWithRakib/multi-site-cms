import React from 'react';
import Image from 'next/image';
import { Calendar, DollarSign, Globe, Info, Lightbulb, MapPin, Sparkles } from 'lucide-react';

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

const DANGEROUS_SCHEMES = /^(javascript|data|vbscript):/i;

function isSafeUrl(url?: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  if (DANGEROUS_SCHEMES.test(trimmed)) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNodeText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (node.content) return node.content.map(getNodeText).join('');
  return '';
}

/**
 * Renders inline text with attached marks (bold, italic, strike, code, link).
 */
function renderTextWithMarks(text: string, marks?: TiptapMark[], key = 0): React.ReactNode {
  if (!marks || marks.length === 0) {
    return text;
  }

  let element: React.ReactNode = text;

  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (!mark) continue;
    const markKey = `${key}-m-${i}`;

    switch (mark.type) {
      case 'bold':
        element = (
          <strong key={markKey} className="font-semibold">
            {element}
          </strong>
        );
        break;
      case 'italic':
        element = (
          <em key={markKey} className="italic">
            {element}
          </em>
        );
        break;
      case 'strike':
        element = (
          <s key={markKey} className="line-through">
            {element}
          </s>
        );
        break;
      case 'code':
        element = (
          <code
            key={markKey}
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary"
          >
            {element}
          </code>
        );
        break;
      case 'link': {
        const href = mark.attrs?.href;
        if (isSafeUrl(href)) {
          element = (
            <a
              key={markKey}
              href={String(href)}
              target={String(href).startsWith('http') ? '_blank' : undefined}
              rel={String(href).startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-primary font-medium underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
            >
              {element}
            </a>
          );
        }
        break;
      }
      default:
        break;
    }
  }

  return element;
}

/**
 * Individual Node Renderer mapping Tiptap AST node to accessible React component.
 */
function renderNode(node: TiptapNode, index: number): React.ReactNode {
  const key = `node-${index}-${node.type}`;

  if (node.type === 'text') {
    return renderTextWithMarks(node.text ?? '', node.marks, index);
  }

  const children = node.content?.map((child, i) => renderNode(child, i));

  switch (node.type) {
    case 'doc':
      return (
        <div key={key} className="article-body space-y-5">
          {children}
        </div>
      );

    case 'paragraph':
      return (
        <p key={key} className="text-foreground/90 font-serif text-lg leading-relaxed">
          {children && children.length > 0 ? children : <br />}
        </p>
      );

    case 'heading': {
      const level = Number(node.attrs?.level) || 2;
      const textContent = getNodeText(node);
      const headingId = slugify(textContent);

      const headingClasses =
        'font-sans font-bold tracking-tight text-foreground scroll-mt-24 group';

      switch (level) {
        case 1:
          return (
            <h1
              key={key}
              id={headingId}
              className={`text-3xl sm:text-4xl mt-10 mb-4 ${headingClasses}`}
            >
              <a href={`#${headingId}`} className="no-underline hover:text-primary">
                {children}
              </a>
            </h1>
          );
        case 2:
          return (
            <h2
              key={key}
              id={headingId}
              className={`text-2xl sm:text-3xl mt-8 mb-4 border-b border-border/50 pb-2 ${headingClasses}`}
            >
              <a href={`#${headingId}`} className="no-underline hover:text-primary">
                {children}
              </a>
            </h2>
          );
        case 3:
          return (
            <h3
              key={key}
              id={headingId}
              className={`text-xl sm:text-2xl mt-6 mb-3 ${headingClasses}`}
            >
              <a href={`#${headingId}`} className="no-underline hover:text-primary">
                {children}
              </a>
            </h3>
          );
        case 4:
        default:
          return (
            <h4
              key={key}
              id={headingId}
              className={`text-lg sm:text-xl mt-5 mb-2 ${headingClasses}`}
            >
              {children}
            </h4>
          );
      }
    }

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-primary pl-5 py-2 my-6 italic text-foreground/80 bg-muted/30 rounded-r-lg font-serif text-lg"
        >
          {children}
        </blockquote>
      );

    case 'bulletList':
      return (
        <ul
          key={key}
          className="list-disc pl-6 space-y-2 my-4 text-foreground/90 font-serif text-lg"
        >
          {children}
        </ul>
      );

    case 'orderedList':
      return (
        <ol
          key={key}
          className="list-decimal pl-6 space-y-2 my-4 text-foreground/90 font-serif text-lg"
        >
          {children}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key} className="leading-relaxed">
          {children}
        </li>
      );

    case 'codeBlock': {
      const codeText = getNodeText(node);
      return (
        <pre
          key={key}
          className="bg-foreground/5 text-foreground p-4 rounded-xl overflow-x-auto my-6 text-sm font-mono border border-border"
        >
          <code>{codeText}</code>
        </pre>
      );
    }

    case 'horizontalRule':
      return <hr key={key} className="my-10 border-border" />;

    case 'image': {
      const src = node.attrs?.src;
      if (!isSafeUrl(src)) return null;

      const alt = String(node.attrs?.alt || 'Article visual');
      const title = node.attrs?.title ? String(node.attrs.title) : null;
      const caption = node.attrs?.caption ? String(node.attrs.caption) : title;
      const width = Number(node.attrs?.width) || 1200;
      const height = Number(node.attrs?.height) || 800;

      return (
        <figure
          key={key}
          className="my-8 overflow-hidden rounded-2xl bg-muted/20 border border-border/60"
        >
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={String(src)}
              alt={alt}
              width={width}
              height={height}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
              loading="lazy"
            />
          </div>
          {caption && (
            <figcaption className="p-3 text-center text-xs sm:text-sm text-muted-foreground font-sans">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'table':
      return (
        <div key={key} className="overflow-x-auto my-8 rounded-xl border border-border">
          <table className="w-full text-left border-collapse font-sans text-sm">{children}</table>
        </div>
      );

    case 'tableRow':
      return (
        <tr
          key={key}
          className="border-b border-border last:border-none hover:bg-muted/30 transition-colors"
        >
          {children}
        </tr>
      );

    case 'tableHeader':
      return (
        <th
          key={key}
          className="bg-muted/60 p-3.5 font-semibold text-foreground border-r border-border last:border-none"
        >
          {children}
        </th>
      );

    case 'tableCell':
      return (
        <td key={key} className="p-3.5 text-foreground/90 border-r border-border last:border-none">
          {children}
        </td>
      );

    // Custom Extension: Destination Info Card
    case 'destinationInfoBlock': {
      const attrs = node.attrs ?? {};
      const destination = attrs.destination ? String(attrs.destination) : 'Destination Overview';
      const country = attrs.country ? String(attrs.country) : null;
      const region = attrs.region ? String(attrs.region) : null;
      const bestSeason = attrs.bestTimeToVisit ? String(attrs.bestTimeToVisit) : null;
      const currency = attrs.currency ? String(attrs.currency) : null;
      const language = attrs.language ? String(attrs.language) : null;
      const highlights = Array.isArray(attrs.highlights) ? (attrs.highlights as string[]) : [];

      return (
        <aside
          key={key}
          className="my-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/30 p-6 shadow-sm font-sans"
        >
          <div className="flex items-center gap-3 border-b border-border/80 pb-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-foreground">{destination}</h4>
              {(country || region) && (
                <p className="text-xs text-muted-foreground">
                  {[region, country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {bestSeason && (
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Best Season
                  </span>
                  <span className="text-foreground font-medium">{bestSeason}</span>
                </div>
              </div>
            )}
            {currency && (
              <div className="flex items-start gap-2.5">
                <DollarSign className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Currency
                  </span>
                  <span className="text-foreground font-medium">{currency}</span>
                </div>
              </div>
            )}
            {language && (
              <div className="flex items-start gap-2.5">
                <Globe className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Language
                  </span>
                  <span className="text-foreground font-medium">{language}</span>
                </div>
              </div>
            )}
          </div>

          {highlights.length > 0 && (
            <div className="mt-5 border-t border-border/60 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Key Highlights
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground/90">
                {highlights.map((h, hi) => (
                  <li key={hi} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      );
    }

    // Custom Extension: Callout / Tip box
    case 'callout': {
      const type = String(node.attrs?.type || 'info');
      const isTip = type === 'tip';
      const isWarn = type === 'warning';

      return (
        <div
          key={key}
          className={`my-6 rounded-xl border p-4.5 flex gap-3 text-sm font-sans ${
            isWarn
              ? 'border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200'
              : isTip
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200'
                : 'border-primary/20 bg-primary/5 text-foreground'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isTip ? (
              <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : isWarn ? (
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Info className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="space-y-1">{children}</div>
        </div>
      );
    }

    // Custom Extension: YouTube Embed
    case 'youtubeEmbed': {
      const src = node.attrs?.src;
      if (!isSafeUrl(src)) return null;

      return (
        <div
          key={key}
          className="my-8 aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-md"
        >
          <iframe
            src={String(src)}
            title="Video player"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Fallback: If node type is unknown, safely render its children
    default:
      if (children && children.length > 0) {
        return <div key={key}>{children}</div>;
      }
      return null;
  }
}

export interface DocRendererProps {
  document: Record<string, unknown> | null | undefined;
}

/**
 * Top-level structured content renderer.
 * Validates root node and maps children safely without `dangerouslySetInnerHTML`.
 */
export function DocRenderer({ document }: DocRendererProps) {
  if (!document || typeof document !== 'object') {
    return null;
  }

  const root = document as unknown as TiptapNode;
  return <div className="prose-content max-w-none">{renderNode(root, 0)}</div>;
}
