import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
} from '@multi-site-cms/ui';

import { siteConfig } from '@/config/site';

const editorialPillars = [
  {
    number: '01',
    title: 'Destination guides',
    description:
      'Practical, deeply researched guides designed to be useful long after the first visit.',
  },
  {
    number: '02',
    title: 'Reported stories',
    description:
      'Human-scale travel writing with room for nuance, context and a strong point of view.',
  },
  {
    number: '03',
    title: 'Visual journeys',
    description:
      'Image-led features and galleries that give a place texture before the first paragraph.',
  },
] as const;

export default function TravelHomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border/80 bg-background/90">
        <Container className="flex items-center justify-between gap-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold tracking-[0.12em] text-primary-foreground">
              TB
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">{siteConfig.name}</p>
              <p className="text-xs text-muted-foreground">Independent travel journal</p>
            </div>
          </div>
          <Badge variant="outline">Working title</Badge>
        </Container>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/70">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-8 size-80 rounded-full bg-primary/10 blur-3xl"
          />
          <Container className="relative grid gap-10 py-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] lg:items-end lg:py-28">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Stories for the road ahead
              </p>
              <h1 className="mt-5 max-w-3xl text-balance font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Travel slowly.
                <br />
                Look closely.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                {siteConfig.description}
              </p>
            </div>
            <aside className="border-l border-border pl-6">
              <p className="text-sm font-medium text-foreground">Phase 01 foundation</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The publication shell, typography and visual language are in place. Editorial
                content begins once the shared content platform is implemented.
              </p>
            </aside>
          </Container>
        </section>

        <section aria-labelledby="pillars-heading" className="py-16 sm:py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Editorial direction
                </p>
                <h2
                  id="pillars-heading"
                  className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl"
                >
                  Three ways into a place.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                The shared CMS will power all three formats without forcing every story into the
                same template.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {editorialPillars.map((pillar) => (
                <Card key={pillar.number} className="border-border/80 bg-card/70">
                  <CardHeader>
                    <p className="font-mono text-xs text-primary">{pillar.number}</p>
                    <CardTitle className="font-serif text-2xl font-normal">
                      {pillar.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{pillar.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-border">
        <Container className="flex flex-col gap-2 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Foundation preview.
          </p>
          <p>One platform. Independent publications.</p>
        </Container>
      </footer>
    </div>
  );
}
