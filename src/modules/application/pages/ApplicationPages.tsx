import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { publicQueries } from "@/shared/api/publicQueries";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { StoneGrid } from "@/shared/components/StoneCard";
import { Slab } from "@/shared/components/Slab";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { InstagramEmbed } from "../components/InstagramEmbed";

/**
 * Website §7 and Admin Scope §4 — Shop by Application.
 *
 * The seven categories are fixed by the requirement document. What varies is
 * how much MOSSANO has behind each one: project photography, tagged stone, or
 * neither. The tile behaves differently in each case rather than always being a
 * link, because the client has supplied no application photography yet and a
 * grid of links to empty pages would read as a broken site.
 */
export function ApplicationIndexPage() {
  const { data } = useQuery(publicQueries.applications());
  const { whatsapp } = useSiteConfig();
  const applications = data ?? [];

  return (
    <Section className="pt-24 sm:pt-28">
      <header className="max-w-2xl">
        <div className="rule" />
        <p className="label mt-4">Shop by Application</p>
        <h1 className="h-display mt-2">Stone in Place</h1>
        <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
          A slab reads differently on a bathroom wall than it does on a hotel lobby floor. Start
          from where it is going.
        </p>
      </header>

      <ul className="mt-16 divide-y divide-ivory-dark border-y border-ivory-dark">
        {applications.map((application) => (
          <li key={application.slug}>
            {application.isEmpty ? (
              <div className="flex flex-wrap items-baseline justify-between gap-4 py-7">
                <span className="font-display text-[1.05rem] uppercase tracking-wide text-ink-faint">
                  {application.label}
                </span>
                <span className="label">Photography coming</span>
              </div>
            ) : (
              <Link
                to={application.href}
                className="group flex flex-wrap items-baseline justify-between gap-4 py-7 transition-colors hover:text-brass"
              >
                <span className="font-display text-[1.05rem] uppercase tracking-wide">
                  {application.label}
                </span>
                <span className="label tabular-nums">
                  {application.projectCount
                    ? `${application.projectCount} project${application.projectCount === 1 ? "" : "s"}`
                    : `${application.stoneCount} lot${application.stoneCount === 1 ? "" : "s"}`}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <p className="max-w-prose text-[0.9rem] leading-relaxed text-ink-soft">
          Working on something not listed here? MOSSANO sources for it.
        </p>
        <WhatsAppButton href={whatsapp.general} className="mt-6" variant="outline" />
      </div>
    </Section>
  );
}

export function ApplicationDetailPage() {
  const { slug = "" } = useParams();
  const { data, isError } = useQuery(publicQueries.application(slug));
  const { whatsapp } = useSiteConfig();

  const label = (data?.meta?.label as string) ?? slug.replace(/-/g, " ");
  const content = data?.content;
  const projects = data?.projects ?? [];
  const stones = data?.stones ?? [];

  return (
    <>
      <Section className="pt-24 sm:pt-28">
        <header className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4">
            <Link to="/application" className="underline-offset-4 hover:underline">
              Shop by Application
            </Link>
          </p>
          <h1 className="h-display mt-2">{content?.headline || label}</h1>
          {content?.description && (
            <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
              {content.description}
            </p>
          )}
        </header>

        {/* Phase-2 feedback §5 — the application's own imagery. Deliberately
            above the projects and separate from them: this shows the use case,
            a project below shows a named development MOSSANO supplied. */}
        {content && content.images.length > 0 && (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.images.map((image, i) => (
              <Slab
                key={image.id}
                media={image}
                alt={image.alt || `${label} in natural stone`}
                aspect="landscape"
                priority={i < 3}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <Link key={project.id} to={project.href} className="group block">
                <Slab
                  media={project.coverImage}
                  alt={project.title}
                  aspect="landscape"
                  priority={i < 3}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <h2 className="mt-4 font-display text-[1rem] uppercase tracking-wide">
                  {project.projectName ?? project.title}
                </h2>
                {/* Phase-1 feedback §7 — the architect credit is admin-only
                    now. It is still captured and still searchable in the admin;
                    it just no longer appears on the public card. */}
                {project.location && (
                  <p className="mt-1 text-[0.8rem] text-ink-faint">{project.location}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section tone="deep">
        <SectionHeading
          label="Specify"
          title={`Stone for ${label}`}
          action={{
            to: `/shop?application=${slug}`,
            label: "Refine in the Stone Shop",
          }}
        />
        <div className="mt-12">
          {stones.length ? (
            <StoneGrid stones={stones.slice(0, 9)} priorityCount={0} />
          ) : (
            <EmptyState
              title={isError ? "Unknown application" : "Nothing tagged for this yet"}
              body="MOSSANO can recommend from stock and from its supplier network."
              action={<WhatsAppButton href={whatsapp.general} label="Ask for recommendations" />}
            />
          )}
        </div>
      </Section>
    </>
  );
}

/** One photographed project, and the lots it used. */
export function ApplicationProjectPage() {
  const { projectSlug = "" } = useParams();
  const { data, isError } = useQuery(publicQueries.applicationProject(projectSlug));

  if (isError) {
    return (
      <Section>
        <EmptyState
          title="Project not found"
          action={
            <Link to="/application" className="btn-outline">
              All applications
            </Link>
          }
        />
      </Section>
    );
  }

  if (!data)
    return (
      <Section>
        <div className="h-64" />
      </Section>
    );

  return (
    <>
      <Section className="pt-24 sm:pt-28">
        <header className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4">
            <Link
              to={`/application/${data.application}`}
              className="underline-offset-4 hover:underline"
            >
              {data.applicationLabel}
            </Link>
          </p>
          <h1 className="h-display mt-2">{data.projectName ?? data.title}</h1>
          {/* Phase-1 feedback §7 — architect credit removed from public view. */}
          {data.location && <p className="mt-3 text-[0.9rem] text-ink-faint">{data.location}</p>}
          {data.description && (
            <p className="mt-6 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
              {data.description}
            </p>
          )}
        </header>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {data.images.map((image, i) => (
            <Slab
              key={image.id}
              media={image}
              alt={image.alt || data.title}
              aspect="landscape"
              priority={i < 2}
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>

        {/* Phase-1 feedback §6 — uploaded video. */}
        {data.videos.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {data.videos.map((video) => (
              <video
                key={video.id}
                src={video.url}
                poster={video.thumbnailUrl ?? undefined}
                controls
                playsInline
                preload="none"
                className="w-full bg-ivory-deep"
              />
            ))}
          </div>
        )}

        {/* Phase-2 feedback §3 — Instagram reels, by URL from the CRM. */}
        {data.instagramUrls.length > 0 && (
          <div className="mt-14">
            <p className="label">On Instagram</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.instagramUrls.map((url) => (
                <InstagramEmbed key={url} url={url} />
              ))}
            </div>
          </div>
        )}

        {data.links.length > 0 && (
          <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {data.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="label underline-offset-4 transition-colors hover:text-brass hover:underline"
              >
                {link.label}
              </a>
            ))}
          </p>
        )}
      </Section>

      {data.stones && data.stones.length > 0 && (
        <Section tone="deep">
          <SectionHeading label="Specified" title="The Stone Used Here" />
          <div className="mt-12">
            <StoneGrid stones={data.stones} priorityCount={0} />
          </div>
        </Section>
      )}
    </>
  );
}
