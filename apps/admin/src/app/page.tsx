import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
} from '@multi-site-cms/ui';

import { PlatformStatus } from '@/components/platform-status';
import { platformConfig } from '@/config/platform';

const foundationItems = [
  {
    title: 'Dynamic site registry',
    description:
      'Sites and hostname mappings are designed as first-class database records, not hardcoded branches.',
    status: 'Specified',
  },
  {
    title: 'Database-backed RBAC',
    description:
      'Super Admin and site-scoped Admin roles share one permission system that can grow to Editors and Authors.',
    status: 'Specified',
  },
  {
    title: 'Shared content, independent publishing',
    description:
      'Canonical content is separated from per-site publications, SEO metadata and presentation overrides.',
    status: 'Specified',
  },
] as const;

export default function AdminHomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--primary)_18%,transparent),_transparent_65%)]"
      />
      <Container className="relative py-14 sm:py-20">
        <header className="flex flex-col gap-5 border-b border-border pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Phase 01</Badge>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {platformConfig.eyebrow}
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                A durable foundation for every publication.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                {platformConfig.description}
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground lg:text-right">
              Engineering foundation only.
              <br />
              Content, authentication and publishing arrive in later phases.
            </p>
          </div>
        </header>

        <section aria-labelledby="status-heading" className="mt-10">
          <h2 id="status-heading" className="sr-only">
            Platform status
          </h2>
          <PlatformStatus />
        </section>

        <section aria-labelledby="foundation-heading" className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="foundation-heading" className="text-2xl font-semibold tracking-tight">
                Architectural foundation
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Decisions documented now so future phases do not invent parallel patterns.
              </p>
            </div>
            <Badge variant="muted">No business features enabled</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {foundationItems.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-border bg-muted/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Local applications
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Admin', 'localhost:3000'],
              ['Travel site', 'localhost:3001'],
              ['Air sports site', 'localhost:3002'],
              ['API', 'localhost:4000/api/v1'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
                <dt className="font-medium">{label}</dt>
                <dd className="mt-1 font-mono text-xs text-muted-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="mt-14 border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
          Read <span className="font-mono">AGENTS.md</span> and the architecture decisions before
          changing foundational boundaries.
        </footer>
      </Container>
    </main>
  );
}
