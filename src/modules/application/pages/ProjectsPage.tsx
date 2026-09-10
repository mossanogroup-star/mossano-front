import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { Slab } from "@/shared/components/Slab";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { publicQueries } from "@/shared/api/publicQueries";
import type { ApplicationProject } from "@/shared/api/types";

/**
 * Phase-1 feedback §6 — the Projects page.
 *
 * Landmark work, grouped by sector the way the client's brochure groups it.
 * Every project here is an Application record with a `sector` set, so the team
 * adds one through the CRM they already use rather than through a second
 * entity that would need its own admin screens.
 *
 * Nothing is listed that the client has not published: an empty page is the
 * correct output until the projects are entered, and it says so.
 */
function ProjectCard({ project, priority }: { project: ApplicationProject; priority: boolean }) {
  return (
    <article className="group relative">
      <Slab
        media={project.coverImage}
        alt={project.projectName ?? project.title}
        aspect="landscape"
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />

      <div className="mt-4">
        <h3 className="font-display text-[1.05rem] uppercase leading-tight tracking-wide">
          <Link
            to={project.href}
            className="after:absolute after:inset-0 after:content-[''] hover:text-brass"
          >
            {project.projectName ?? project.title}
          </Link>
        </h3>

        {/* The brochure's own caption line: what kind of project, how big. */}
        <p className="mt-1.5 text-[0.8rem] text-ink-faint">
          {[project.applicationLabel, project.location].filter(Boolean).join(" · ")}
        </p>
        {project.areaLabel && (
          <p className="mt-1 font-display text-[0.95rem] text-brass">{project.areaLabel}</p>
        )}

        {/* z-10 lifts these clear of the stretched link above. */}
        {(project.hasVideo || project.links.length > 0) && (
          <p className="relative z-10 mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {project.hasVideo && <span className="label text-ink-faint">Video</span>}
            {project.links.map((link) => (
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
      </div>
    </article>
  );
}

export function ProjectsPage() {
  const { data: groups } = useQuery(publicQueries.projects());
  const { whatsapp } = useSiteConfig();

  const total = (groups ?? []).reduce((sum, group) => sum + group.projects.length, 0);

  return (
    <>
      <Section tone="dark" className="pt-28">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">Landmark projects</p>
          <h1 className="h-display mt-2 text-ivory">Where MOSSANO Stone Has Gone</h1>
          <p className="mt-8 max-w-prose text-[1rem] leading-relaxed text-ivory/75">
            Residences, hotels, corporate headquarters and infrastructure — from intimate residences
            to landmark developments, our marble defines spaces of distinction.
          </p>
        </div>
      </Section>

      {total === 0 ? (
        <Section>
          <EmptyState
            title="Projects are being added"
            body="MOSSANO is preparing this page. In the meantime, the team can talk you through the work directly."
            action={<WhatsAppButton href={whatsapp.general} />}
          />
        </Section>
      ) : (
        (groups ?? []).map((group, groupIndex) => (
          <Section key={group.slug} tone={groupIndex % 2 === 1 ? "deep" : undefined}>
            <SectionHeading
              label="Landmark projects"
              title={group.label}
              intro={`${group.projects.length} ${group.projects.length === 1 ? "project" : "projects"}`}
            />
            <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {group.projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  priority={groupIndex === 0 && i < 3}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      <Section tone="deep">
        <div className="max-w-2xl">
          <SectionHeading
            label="Your project"
            title="Let's Create Something Timeless"
            intro="Tell MOSSANO what the project needs and the search starts across the whole supplier network."
          />
          <div className="mt-10 flex flex-wrap gap-4">
            <WhatsAppButton href={whatsapp.general} />
            <Link to="/private-sourcing" className="btn-outline">
              Personalize Sourcing
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
