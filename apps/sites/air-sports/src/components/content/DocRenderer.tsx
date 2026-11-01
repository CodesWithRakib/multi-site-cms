import React from 'react';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Clock, Info, ShieldAlert, Wind } from 'lucide-react';

interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

interface DocRendererProps {
  document: Record<string, unknown> | null | undefined;
  className?: string;
}

function sanitizeHref(rawHref: unknown): string {
  if (typeof rawHref !== 'string') return '#';
  const trimmed = rawHref.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '#';
  }
  return trimmed;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNodeText(node: DocNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(getNodeText).join('');
}

function renderMarks(text: string, marks?: DocNode['marks']): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<React.ReactNode>((acc, mark, index) => {
    if (!mark) return acc;
    switch (mark.type) {
      case 'bold':
        return (
          <strong key={index} className="font-bold text-foreground">
            {acc}
          </strong>
        );
      case 'italic':
        return (
          <em key={index} className="italic">
            {acc}
          </em>
        );
      case 'strike':
        return (
          <s key={index} className="line-through">
            {acc}
          </s>
        );
      case 'code':
        return (
          <code
            key={index}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary"
          >
            {acc}
          </code>
        );
      case 'link': {
        const href = sanitizeHref(mark.attrs?.href);
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        return (
          <a
            key={index}
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}

function renderChildren(nodes?: DocNode[]): React.ReactNode {
  if (!nodes || nodes.length === 0) return null;
  return nodes.map((child, idx) => <DocNodeRenderer key={idx} node={child} index={idx} />);
}

function DocNodeRenderer({ node, index }: { node: DocNode; index: number }): React.ReactNode {
  if (node.type === 'text') {
    return renderMarks(node.text || '', node.marks);
  }

  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.level || 2);
      const text = getNodeText(node);
      const anchorId = slugify(text) || `section-${index}`;

      const headingClass =
        'group font-bold tracking-tight text-foreground transition-colors scroll-mt-20 flex items-center gap-2';

      switch (level) {
        case 1:
          return (
            <h1 id={anchorId} className={`mt-8 mb-4 text-3xl sm:text-4xl ${headingClass}`}>
              <a href={`#${anchorId}`} className="hover:text-primary">
                {renderChildren(node.content)}
              </a>
            </h1>
          );
        case 2:
          return (
            <h2
              id={anchorId}
              className={`mt-8 mb-4 text-2xl sm:text-3xl border-b border-border/50 pb-2 ${headingClass}`}
            >
              <a href={`#${anchorId}`} className="hover:text-primary">
                {renderChildren(node.content)}
              </a>
            </h2>
          );
        case 3:
          return (
            <h3 id={anchorId} className={`mt-6 mb-3 text-xl sm:text-2xl ${headingClass}`}>
              <a href={`#${anchorId}`} className="hover:text-primary">
                {renderChildren(node.content)}
              </a>
            </h3>
          );
        case 4:
        default:
          return (
            <h4 id={anchorId} className={`mt-4 mb-2 text-lg sm:text-xl ${headingClass}`}>
              <a href={`#${anchorId}`} className="hover:text-primary">
                {renderChildren(node.content)}
              </a>
            </h4>
          );
      }
    }

    case 'paragraph': {
      return (
        <p className="my-4 leading-7 text-foreground/90 font-normal text-base">
          {renderChildren(node.content)}
        </p>
      );
    }

    case 'blockquote': {
      return (
        <blockquote className="my-6 border-l-4 border-primary bg-muted/30 py-3 px-5 rounded-r-lg italic text-foreground/80">
          {renderChildren(node.content)}
        </blockquote>
      );
    }

    case 'bulletList': {
      return (
        <ul className="my-4 list-disc pl-6 space-y-2 text-foreground/90 marker:text-primary">
          {renderChildren(node.content)}
        </ul>
      );
    }

    case 'orderedList': {
      const start = Number(node.attrs?.start || 1);
      return (
        <ol
          start={start}
          className="my-4 list-decimal pl-6 space-y-2 text-foreground/90 marker:text-primary marker:font-semibold"
        >
          {renderChildren(node.content)}
        </ol>
      );
    }

    case 'listItem': {
      return <li className="leading-relaxed">{renderChildren(node.content)}</li>;
    }

    case 'codeBlock': {
      const language = (node.attrs?.language as string) || '';
      return (
        <div className="my-6 overflow-hidden rounded-lg bg-stone-950 text-stone-100 shadow-md">
          {language && (
            <div className="border-b border-stone-800 bg-stone-900 px-4 py-1.5 text-xs font-mono text-stone-400 uppercase tracking-wider">
              {language}
            </div>
          )}
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
            <code>{renderChildren(node.content)}</code>
          </pre>
        </div>
      );
    }

    case 'horizontalRule': {
      return <hr className="my-8 border-t border-border" />;
    }

    case 'image': {
      const rawSrc = sanitizeHref(node.attrs?.src);
      const alt = (node.attrs?.alt as string) || 'Air sports photo';
      const title = node.attrs?.title as string | undefined;

      if (!rawSrc || rawSrc === '#') return null;

      return (
        <figure className="my-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative aspect-[16/9] w-full bg-muted">
            <Image
              src={rawSrc}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
            />
          </div>
          {(title || alt) && (
            <figcaption className="px-4 py-2.5 text-center text-xs text-muted-foreground border-t border-border/40 font-mono">
              {title || alt}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'youtube': {
      const rawSrc = (node.attrs?.src as string) || '';
      let videoId = '';

      if (rawSrc.includes('youtube.com/watch?v=')) {
        videoId = rawSrc.split('v=')[1]?.split('&')[0] || '';
      } else if (rawSrc.includes('youtu.be/')) {
        videoId = rawSrc.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (rawSrc.includes('youtube.com/embed/')) {
        videoId = rawSrc.split('embed/')[1]?.split('?')[0] || '';
      }

      if (!videoId) return null;

      return (
        <div className="my-8 overflow-hidden rounded-xl border border-border bg-black shadow-md">
          <div className="relative aspect-[16/9] w-full">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
              title="Aviation Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          </div>
        </div>
      );
    }

    case 'table': {
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">{renderChildren(node.content)}</table>
        </div>
      );
    }

    case 'tableRow': {
      return (
        <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
          {renderChildren(node.content)}
        </tr>
      );
    }

    case 'tableHeader': {
      return (
        <th className="bg-muted px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
          {renderChildren(node.content)}
        </th>
      );
    }

    case 'tableCell': {
      return <td className="px-4 py-3 text-foreground/80">{renderChildren(node.content)}</td>;
    }

    // Custom Extension: eventTimelineBlock
    case 'eventTimelineBlock': {
      const attrs = node.attrs || {};
      const time = (attrs.time as string) || '00:00';
      const title = (attrs.title as string) || 'Timeline Event';
      const description = attrs.description as string | undefined;
      const status = (attrs.status as string) || 'scheduled';
      const windSpeed = attrs.windSpeed as string | undefined;
      const weatherCondition = attrs.weatherCondition as string | undefined;
      const alertLevel = (attrs.alertLevel as string) || 'normal';

      const isWarning = alertLevel === 'warning';
      const isAdvisory = alertLevel === 'advisory';

      const badgeColor =
        status === 'live'
          ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
          : status === 'completed'
            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
            : status === 'delayed' || status === 'cancelled'
              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
              : 'bg-muted text-muted-foreground border-border';

      const cardBorder = isWarning
        ? 'border-amber-500/40 bg-amber-500/5'
        : isAdvisory
          ? 'border-blue-500/40 bg-blue-500/5'
          : 'border-border bg-card';

      return (
        <div className={`my-6 rounded-xl border p-5 shadow-xs ${cardBorder}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-foreground/10 text-foreground">
                <Clock className="size-3 text-primary" />
                {time}
              </span>
              <h4 className="text-base font-bold text-foreground">{title}</h4>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeColor}`}
            >
              {status}
            </span>
          </div>

          {description && (
            <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{description}</p>
          )}

          {(windSpeed || weatherCondition || alertLevel !== 'normal') && (
            <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
              {windSpeed && (
                <span className="flex items-center gap-1">
                  <Wind className="size-3.5 text-primary" />
                  Wind: <strong className="text-foreground">{windSpeed}</strong>
                </span>
              )}
              {weatherCondition && (
                <span className="flex items-center gap-1">
                  <Info className="size-3.5 text-blue-500" />
                  Weather: <strong className="text-foreground">{weatherCondition}</strong>
                </span>
              )}
              {alertLevel !== 'normal' && (
                <span className="flex items-center gap-1 text-amber-600 font-bold uppercase">
                  <ShieldAlert className="size-3.5" />
                  Alert: {alertLevel}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Custom Extension: callout
    case 'callout': {
      const type = (node.attrs?.type as string) || 'info';
      const styles =
        {
          info: 'bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-100',
          warning: 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100',
          tip: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100',
        }[type] || 'bg-muted/40 border-border text-foreground';

      const IconComponent = type === 'warning' ? AlertCircle : type === 'tip' ? CheckCircle2 : Info;

      return (
        <div className={`my-6 flex gap-3.5 rounded-xl border p-4.5 ${styles}`}>
          <IconComponent className="size-5 shrink-0 mt-0.5 text-primary" />
          <div className="text-sm leading-relaxed [&>p]:my-1">{renderChildren(node.content)}</div>
        </div>
      );
    }

    default:
      // Unknown nodes fail gracefully by continuing with their children
      return renderChildren(node.content);
  }
}

export function DocRenderer({ document, className = '' }: DocRendererProps) {
  if (!document || typeof document !== 'object') {
    return null;
  }

  const root = document as unknown as DocNode;
  if (!root.content || !Array.isArray(root.content)) {
    return null;
  }

  return (
    <article className={`air-sports-content ${className}`}>
      {root.content.map((node, idx) => (
        <DocNodeRenderer key={idx} node={node} index={idx} />
      ))}
    </article>
  );
}
