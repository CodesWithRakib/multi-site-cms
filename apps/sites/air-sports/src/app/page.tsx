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

const coveragePillars = [
  {
    label: 'Live',
    title: 'Up-to-the-minute updates',
    description:
      'Short-form reporting designed for fast publication without losing editorial control.',
  },
  {
    label: 'Context',
    title: 'Event timelines',
    description:
      'A clear sequence of heats, results, weather calls and the moments that change a competition.',
  },
  {
    label: 'Proof',
    title: 'Media and verification',
    description:
      'Images, embeds and source notes attached to the update they support, not buried elsewhere.',
  },
] as const;

export default function AirSportsHomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <Container className="flex min-h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <p className="text-sm font-bold uppercase tracking-[0.16em]">{siteConfig.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Live desk</Badge>
            <Badge variant="outline">Working title</Badge>
          </div>
        </Container>
      </header>

      <main>
        <section className="bg-foreground text-background">
          <Container className="grid gap-10 py-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:items-end lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-background/65">
                Breaking news · Event coverage · Results
              </p>
              <h1 className="mt-5 max-w-4xl text-balance text-5xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                The sky,
                <br />
                as it happens.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-background/70">
                {siteConfig.description}
              </p>
            </div>
            <aside className="border-l border-background/20 pl-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/55">
                Foundation preview
              </p>
              <p className="mt-3 text-sm leading-6 text-background/70">
                The live shell and visual system are ready. Publishing, event timelines and
                real-time updates arrive after the shared content platform.
              </p>
            </aside>
          </Container>
        </section>

        <section aria-labelledby="coverage-heading" className="py-16 sm:py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Coverage model
                </p>
                <h2
                  id="coverage-heading"
                  className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  Fast, but never loose.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Live publishing needs a different rhythm from long-form editorial. The shared
                platform is designed to support both.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {coveragePillars.map((pillar) => (
                <Card key={pillar.title} className="border-t-4 border-t-primary">
                  <CardHeader>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      {pillar.label}
                    </p>
                    <CardTitle className="text-xl">{pillar.title}</CardTitle>
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

      <footer className="border-t border-border bg-card">
        <Container className="flex flex-col gap-2 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Foundation preview.
          </p>
          <p>Independent publication. Shared platform.</p>
        </Container>
      </footer>
    </div>
  );
}
