import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ProjectCard from "@/components/projects/ProjectCard";
import { projects } from "@/data/projects";

export const metadata: Metadata = { title: "Projects" };

// ---- Projects page -----------------------------------------------------------
// A single vertical column of paper cards. There is no 3D canvas here on
// purpose, so scrolling stays perfectly smooth.
export default function ProjectsPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-2 pb-4 pt-12 md:px-8 md:pt-16">
        {/* page title + the short line under it */}
        <header className="text-center">
          <h1 className="text-4xl text-[#15130f] md:text-5xl">Projects</h1>
          <p className="mt-2 text-base text-[#4a453c] md:text-lg">
            Things I&apos;ve built
          </p>
        </header>

        {/* one centred column, with space between the cards */}
        <div className="mt-12 flex flex-col items-center gap-14 md:mt-16 md:gap-20">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
