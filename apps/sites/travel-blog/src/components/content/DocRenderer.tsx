import React from 'react';
import Image from 'next/image';
import { CalloutBox } from './CalloutBox';
import { DestinationInfoCard } from './DestinationInfoCard';
import { toYouTubeEmbedUrl } from '@multi-site-cms/config/embeds';
import { headingId } from '@multi-site-cms/config/doc-outline';
import { EventTimelineCard } from './EventTimelineCard';

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

function getNodeText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (node.content) return node.content.map(getNodeText).join('');
  return '';
}

function renderTextWithMarks(text: string, marks?: TiptapMark[], key = 0): React.ReactNode {
  if (!marks || marks.length === 0) return text;

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
      case 'underline':
        element = (
          <u key={markKey} className="underline underline-offset-4">
            {element}
          </u>
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
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-emerald-600 dark:text-emerald-400"
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
              className="text-emerald-600 dark:text-emerald-400 font-medium underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-500 transition-colors"
            >
              {element}
            </a>
          );
        }
        break;
      }
    }
  }
  return element;
}

function renderHeading(level: number, anchorId: string, children: React.ReactNode, key: string) {
  const cls = 'font-sans font-bold tracking-tight text-foreground scroll-mt-24 group';
  if (level === 1) {
    return (
      <h1 key={key} id={anchorId} className={`text-3xl sm:text-4xl mt-10 mb-4 ${cls}`}>
        <a href={`#${anchorId}`} className="no-underline hover:text-emerald-600">
          {children}
        </a>
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2
        key={key}
        id={anchorId}
        className={`text-2xl sm:text-3xl mt-8 mb-4 border-b border-border/50 pb-2 ${cls}`}
      >
        <a href={`#${anchorId}`} className="no-underline hover:text-emerald-600">
          {children}
        </a>
      </h2>
    );
  }
  if (level === 3) {
    return (
      <h3 key={key} id={anchorId} className={`text-xl sm:text-2xl mt-6 mb-3 ${cls}`}>
        <a href={`#${anchorId}`} className="no-underline hover:text-emerald-600">
          {children}
        </a>
      </h3>
    );
  }
  return (
    <h4 key={key} id={anchorId} className={`text-lg sm:text-xl mt-5 mb-2 ${cls}`}>
      {children}
    </h4>
  );
}

/** Editor text alignment (TextAlign extension); left is the default. */
function alignStyle(node: TiptapNode): React.CSSProperties | undefined {
  const align = node.attrs?.textAlign;
  return align === 'center' || align === 'right' || align === 'justify'
    ? { textAlign: align }
    : undefined;
}

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
        <p
          key={key}
          className="text-foreground/90 font-serif text-lg leading-relaxed"
          style={alignStyle(node)}
        >
          {children && children.length > 0 ? children : <br />}
        </p>
      );
    case 'heading': {
      const level = Number(node.attrs?.level) || 2;
      return renderHeading(level, headingId(getNodeText(node)), children, key);
    }
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-emerald-500 pl-5 py-2 my-6 italic text-foreground/80 bg-muted/30 rounded-r-lg font-serif text-lg"
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
    case 'codeBlock':
      return (
        <pre
          key={key}
          className="bg-foreground/5 text-foreground p-4 rounded-xl overflow-x-auto my-6 text-sm font-mono border border-border"
        >
          <code>{getNodeText(node)}</code>
        </pre>
      );
    case 'hardBreak':
      return <br key={key} />;
    case 'horizontalRule':
      return <hr key={key} className="my-10 border-border" />;
    case 'image': {
      const src = node.attrs?.src;
      if (!isSafeUrl(src)) return null;
      const alt = String(node.attrs?.alt || 'Article visual');
      const caption = node.attrs?.caption
        ? String(node.attrs.caption)
        : node.attrs?.title
          ? String(node.attrs.title)
          : null;
      return (
        <figure
          key={key}
          className="my-8 overflow-hidden rounded-2xl bg-muted/20 border border-border/60"
        >
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={String(src)}
              alt={alt}
              width={Number(node.attrs?.width) || 1200}
              height={Number(node.attrs?.height) || 800}
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
          {/* Rows need a <tbody>: <tr> directly in <table> breaks hydration. */}
          <table className="w-full text-left border-collapse font-sans text-sm">
            <tbody>{children}</tbody>
          </table>
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
    case 'destinationInfoBlock': {
      const attrs = node.attrs ?? {};
      return (
        <DestinationInfoCard
          key={key}
          destination={attrs.destination ? String(attrs.destination) : undefined}
          country={attrs.country ? String(attrs.country) : undefined}
          region={attrs.region ? String(attrs.region) : undefined}
          bestSeason={String(attrs.bestSeason || attrs.bestTimeToVisit || '') || undefined}
          currency={attrs.currency ? String(attrs.currency) : undefined}
          language={attrs.language ? String(attrs.language) : undefined}
          elevation={attrs.elevation ? String(attrs.elevation) : undefined}
          highlights={Array.isArray(attrs.highlights) ? (attrs.highlights as string[]) : []}
        />
      );
    }
    case 'eventTimelineBlock': {
      const attrs = node.attrs ?? {};
      return (
        <EventTimelineCard
          key={key}
          time={attrs.time ? String(attrs.time) : undefined}
          title={attrs.title ? String(attrs.title) : undefined}
          description={attrs.description ? String(attrs.description) : undefined}
          status={attrs.status as EventTimelineCardProps['status']}
          windSpeed={attrs.windSpeed ? String(attrs.windSpeed) : undefined}
          weatherCondition={attrs.weatherCondition ? String(attrs.weatherCondition) : undefined}
          alertLevel={attrs.alertLevel as EventTimelineCardProps['alertLevel']}
        />
      );
    }
    case 'callout':
    case 'calloutBlock':
      return (
        <CalloutBox key={key} type={node.attrs?.type as 'info' | 'warning' | 'tip'}>
          {children}
        </CalloutBox>
      );
    case 'youtubeEmbed':
    case 'youtube': {
      // Only YouTube is embeddable; anything else is dropped, never iframed.
      const src = toYouTubeEmbedUrl(node.attrs?.src);
      if (!src) return null;
      return (
        <div
          key={key}
          className="my-8 aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-md"
        >
          <iframe
            src={src}
            title="Video player"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    default:
      return children && children.length > 0 ? <div key={key}>{children}</div> : null;
  }
}

type EventTimelineCardProps = React.ComponentProps<typeof EventTimelineCard>;

export interface DocRendererProps {
  document: Record<string, unknown> | null | undefined;
}

export function DocRenderer({ document }: DocRendererProps) {
  if (!document || typeof document !== 'object') return null;
  const root = document as unknown as TiptapNode;
  return <div className="prose-content max-w-none">{renderNode(root, 0)}</div>;
}
