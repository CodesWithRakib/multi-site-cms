import Link from 'next/link';
import { Compass, ExternalLink, Heart } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/60 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-serif text-lg font-bold text-foreground">
                {siteConfig.name}
              </span>
            </Link>
            <p className="font-serif text-sm text-muted-foreground max-w-md leading-relaxed">
              {siteConfig.description}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Crafted with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by travel
              storytellers.
            </p>
          </div>

          {/* Editorial Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Front Page
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-primary transition-colors">
                  Destination Guides
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/tags" className="hover:text-primary transition-colors">
                  Tags & Topics
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Search Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Syndication & Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Resources & Feed
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sitemap.xml" className="hover:text-primary transition-colors">
                  Sitemap XML
                </Link>
              </li>
              <li>
                <Link href="/robots.txt" className="hover:text-primary transition-colors">
                  Robots Directive
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:5000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Admin Portal <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>
            © {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <p>Powered by multi-site-cms core platform.</p>
        </div>
      </div>
    </footer>
  );
}
