import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Play, Maximize2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Section, SectionHeading, EmptyState } from "@/shared/components/Section";
import { Slab } from "@/shared/components/Slab";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { publicQueries } from "@/shared/api/publicQueries";
import { cn } from "@/shared/lib/cn";
import type { ApplicationProject, Media, ProjectVideo } from "@/shared/api/types";
import { InstagramEmbed } from "../components/InstagramEmbed";

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
      <div className="relative">
        <Slab
          media={project.coverImage}
          alt={project.projectName ?? project.title}
          aspect="landscape"
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {/* Phase-3 feedback — "projects: images and videos". The video plays on
            the project's own page; here it is marked on the photograph, where
            the word "Video" under the caption was being read as a tag. */}
        {project.hasVideo && (
          <span
            className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-ink/70 px-2.5 py-1 font-sans text-[0.6rem] uppercase tracking-label text-ivory"
            aria-hidden="true"
          >
            <Play className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
            Video
          </span>
        )}
      </div>

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
        {project.links.length > 0 && (
          <p className="relative z-10 mt-3 flex flex-wrap gap-x-4 gap-y-1">
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

/**
 * Phase-3 feedback — Projects is two pages, Images and Videos, under one hero.
 * Real routes rather than local state, so each tab has its own address and the
 * server renders whichever one was asked for.
 */
const TABS = [
  { to: "/projects", label: "Images" },
  { to: "/projects/videos", label: "Videos" },
];

function ProjectsHero() {
  return (
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

      <nav className="mt-12 flex gap-8 border-b border-ivory/15" aria-label="Projects">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 pb-3 font-sans text-[0.72rem] uppercase tracking-label transition-colors",
                isActive
                  ? "border-brass text-ivory"
                  : "border-transparent text-ivory/55 hover:text-ivory",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </Section>
  );
}

function ProjectsCta({ whatsapp }: { whatsapp: string }) {
  return (
    <Section tone="deep">
      <div className="max-w-2xl">
        <SectionHeading
          label="Your project"
          title="Let's Create Something Timeless"
          intro="Tell MOSSANO what the project needs and the search starts across the whole supplier network."
        />
        <div className="mt-10 flex flex-wrap gap-4">
          <WhatsAppButton href={whatsapp} />
          <Link to="/private-sourcing" className="btn-outline">
            Personalize Sourcing
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function ProjectsPage() {
  const { data: groups } = useQuery(publicQueries.projects());
  const { whatsapp } = useSiteConfig();

  const total = (groups ?? []).reduce((sum, group) => sum + group.projects.length, 0);

  return (
    <>
      <ProjectsHero />

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

      <ProjectsCta whatsapp={whatsapp.general} />
    </>
  );
}

/**
 * An uploaded video as a tile: a silent 480px loop that plays only while it is
 * on screen, the way premium portfolio sites do it. Nothing but the poster
 * loads until the tile scrolls into view, and it pauses again when it leaves,
 * so a page of twelve never decodes twelve videos at once. Under
 * prefers-reduced-motion it stays on the poster.
 */
function VideoTile({ media, title, onOpen }: { media: Media; title: string; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Play ${title} with sound`}
      className="group relative block aspect-[4/5] w-full overflow-hidden bg-ink"
    >
      <video
        ref={ref}
        src={media.previewUrl ?? media.streamUrl ?? media.url}
        poster={media.thumbnailUrl}
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-ivory/50 bg-ink/30 text-ivory backdrop-blur-sm transition-colors duration-300 group-hover:border-brass group-hover:bg-brass">
        <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.6} />
      </span>
    </button>
  );
}

/**
 * The same video, large and with sound. No player chrome, as the client asked:
 * a tap on the picture pauses and resumes, and a hairline of brass along the
 * bottom is the only progress shown. A native <dialog>, like ZoomableSlab, for
 * the backdrop, focus trap and Escape.
 */
function VideoLightbox({ video, onClose }: { video: ProjectVideo; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const media = video.video!;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const toggle = () => {
    const el = player.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={() => dialog.current?.close()}
      className="max-h-[94vh] max-w-[94vw] bg-transparent p-0 backdrop:bg-ink/90 backdrop:backdrop-blur-sm"
    >
      <figure onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-ink">
          <video
            ref={player}
            poster={media.thumbnailUrl}
            autoPlay
            playsInline
            onClick={toggle}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onTimeUpdate={(e) =>
              setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))
            }
            className="max-h-[82vh] w-auto max-w-[94vw] cursor-pointer object-contain"
          >
            {media.streamUrl && <source src={media.streamUrl} />}
            <source src={media.url} />
          </video>
          {paused && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ivory/70 bg-ink/40 text-ivory backdrop-blur-sm">
              <Play className="ml-1 h-6 w-6 fill-current" strokeWidth={0} />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 h-px bg-ivory/15">
            <span className="block h-full bg-brass" style={{ width: `${progress * 100}%` }} />
          </span>
        </div>
        <figcaption className="mt-3 flex items-baseline justify-between gap-6">
          <span className="font-sans text-[0.75rem] uppercase tracking-label text-ivory/80">
            {[video.title, video.location].filter(Boolean).join(" · ")}
          </span>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="text-ivory/60 transition-colors hover:text-ivory"
          >
            <X className="h-5 w-5" strokeWidth={1.4} />
          </button>
        </figcaption>
      </figure>
    </dialog>
  );
}

function VideoCard({ video, onOpen }: { video: ProjectVideo; onOpen: () => void }) {
  return (
    <article>
      {video.video ? (
        <VideoTile media={video.video} title={video.title} onOpen={onOpen} />
      ) : (
        video.instagramUrl && <InstagramEmbed url={video.instagramUrl} />
      )}
      <h3 className="mt-3 font-display text-[0.85rem] uppercase leading-tight tracking-wide sm:text-[0.95rem]">
        {video.title}
      </h3>
      {video.location && (
        <p className="mt-1 text-[0.72rem] text-ink-faint sm:text-[0.78rem]">{video.location}</p>
      )}
    </article>
  );
}

export function ProjectVideosPage() {
  const { data: videos = [] } = useQuery(publicQueries.projectVideos());
  const { whatsapp } = useSiteConfig();
  const [open, setOpen] = useState<ProjectVideo | null>(null);

  return (
    <>
      <ProjectsHero />

      <Section>
        {videos.length === 0 ? (
          <EmptyState
            title="Videos are being added"
            body="MOSSANO is preparing this page. In the meantime, the team can talk you through the work directly."
            action={<WhatsAppButton href={whatsapp.general} />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} onOpen={() => setOpen(video)} />
            ))}
          </div>
        )}
        {open && <VideoLightbox video={open} onClose={() => setOpen(null)} />}
      </Section>

      <ProjectsCta whatsapp={whatsapp.general} />
    </>
  );
}
