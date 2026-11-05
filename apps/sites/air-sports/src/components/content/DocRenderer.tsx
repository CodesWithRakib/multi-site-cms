import React from 'react';
import Image from 'next/image';
import { AirSportsCallout } from './AirSportsCallout';
import { AirSportsDestinationCard } from './AirSportsDestinationCard';
import { AirSportsTimelineCard } from './AirSportsTimelineCard';

export interface DocMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: DocMark[];
  text?: string;
}

export interface DocRendererProps {
  document: Record<string, unknown> | null | undefined;
  className?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderChildren(content?: DocNode[]): React.ReactNode {
  if (!content || !Array.isArray(content)) return null;
  return content.map((child, idx) => <DocNodeRenderer key={idx} node={child} index={idx} />);
}

function renderTextNode(node: DocNode, index: number): React.ReactNode {
  let element: React.ReactNode = node.text || '';
  if (node.marks) {
    for (const mark of node.marks) {
      if (mark.type === 'bold') {
        element = <strong className="font-bold text-foreground">{element}</strong>;
      } else if (mark.type === 'italic') {
        element = <em className="italic">{element}</em>;
      } else if (mark.type === 'strike') {
        element = <s className="line-through">{element}</s>;
      } else if (mark.type === 'code') {
        element = (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
            {element}
          </code>
        );
      } else if (mark.type === 'link') {
        const href = (mark.attrs?.href as string) || '#';
        const isDangerous = /^(javascript|data|vbscript):/i.test(href);
        const safeHref = isDangerous ? '#' : href;
        element = (
          <a
            href={safeHref}
            target={safeHref.startsWith('http') ? '_blank' : undefined}
            rel={safeHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            {element}
          </a>
        );
      }
    }
  }
  return <React.Fragment key={index}>{element}</React.Fragment>;
}

function DocNodeRenderer({ node, index }: { node: DocNode; index: number }): React.ReactNode {
  if (node.type === 'text') return renderTextNode(node, index);

  switch (node.type) {
    case 'paragraph':
      return (
        <p className="my-4 text-base leading-relaxed text-foreground/90">
          {renderChildren(node.content)}
        </p>
      );
    case 'heading': {
      const level = (node.attrs?.level as number) || 2;
      const text = node.content?.map((c) => c.text).join('') || '';
      const id = slugify(text);
      if (level === 1)
        return (
          <h1
            id={id}
            className="mt-8 mb-4 text-3xl font-black uppercase tracking-tight text-foreground"
          >
            {renderChildren(node.content)}
          </h1>
        );
      if (level === 2)
        return (
          <h2
            id={id}
            className="mt-7 mb-3 text-2xl font-black uppercase tracking-tight text-foreground border-b border-border/40 pb-2"
          >
            {renderChildren(node.content)}
          </h2>
        );
      if (level === 3)
        return (
          <h3
            id={id}
            className="mt-6 mb-2 text-xl font-bold uppercase tracking-tight text-foreground"
          >
            {renderChildren(node.content)}
          </h3>
        );
      return (
        <h4 id={id} className="mt-5 mb-2 text-lg font-bold text-foreground">
          {renderChildren(node.content)}
        </h4>
      );
    }
    case 'blockquote':
      return (
        <blockquote className="my-6 border-l-4 border-primary pl-4 italic text-foreground/85 bg-primary/5 py-2 rounded-r-lg">
          {renderChildren(node.content)}
        </blockquote>
      );
    case 'bulletList':
      return (
        <ul className="my-4 ml-6 list-disc space-y-1 text-foreground/90">
          {renderChildren(node.content)}
        </ul>
      );
    case 'orderedList':
      return (
        <ol className="my-4 ml-6 list-decimal space-y-1 text-foreground/90">
          {renderChildren(node.content)}
        </ol>
      );
    case 'listItem':
      return <li className="pl-1 leading-relaxed">{renderChildren(node.content)}</li>;
    case 'codeBlock':
      return (
        <pre className="my-6 overflow-x-auto rounded-xl border border-border bg-foreground/5 p-4 font-mono text-xs text-foreground">
          <code>{node.content?.map((c) => c.text).join('')}</code>
        </pre>
      );
    case 'horizontalRule':
      return <hr className="my-8 border-border" />;
    case 'image': {
      const src = node.attrs?.src as string;
      const alt = (node.attrs?.alt as string) || '';
      const caption = (node.attrs?.caption as string) || (node.attrs?.title as string);
      if (!src) return null;
      return (
        <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-muted">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 800px"
            />
          </div>
          {caption && (
            <figcaption className="p-3 text-center font-mono text-xs text-muted-foreground">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'table':
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left font-mono text-xs">
            {renderChildren(node.content)}
          </table>
        </div>
      );
    case 'tableRow':
      return (
        <tr className="border-b border-border last:border-none hover:bg-muted/30 transition-colors">
          {renderChildren(node.content)}
        </tr>
      );
    case 'tableHeader':
      return (
        <th className="bg-muted/70 px-4 py-3 font-bold uppercase tracking-wider text-foreground">
          {renderChildren(node.content)}
        </th>
      );
    case 'tableCell':
      return <td className="px-4 py-3 text-foreground/80">{renderChildren(node.content)}</td>;
    case 'eventTimelineBlock': {
      const attrs = node.attrs || {};
      return (
        <AirSportsTimelineCard
          time={(attrs.time as string) || '00:00'}
          title={(attrs.title as string) || 'Timeline Event'}
          description={attrs.description as string | undefined}
          status={(attrs.status as string) || 'scheduled'}
          windSpeed={attrs.windSpeed as string | undefined}
          weatherCondition={attrs.weatherCondition as string | undefined}
          alertLevel={(attrs.alertLevel as string) || 'normal'}
        />
      );
    }
    case 'destinationInfoBlock': {
      const attrs = node.attrs || {};
      return (
        <AirSportsDestinationCard
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
    case 'callout':
    case 'calloutBlock':
      return (
        <AirSportsCallout type={(node.attrs?.type as string) || 'info'}>
          {renderChildren(node.content)}
        </AirSportsCallout>
      );
    case 'youtubeEmbed':
    case 'youtube': {
      const src = node.attrs?.src as string;
      if (!src) return null;
      return (
        <div className="my-8 aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-md">
          <iframe
            src={src}
            title="Video player"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    default:
      return renderChildren(node.content);
  }
}

export function DocRenderer({ document, className = '' }: DocRendererProps) {
  if (!document || typeof document !== 'object') return null;
  const root = document as unknown as DocNode;
  if (!root.content || !Array.isArray(root.content)) return null;

  return (
    <article className={`air-sports-content ${className}`}>
      {root.content.map((node, idx) => (
        <DocNodeRenderer key={idx} node={node} index={idx} />
      ))}
    </article>
  );
}
