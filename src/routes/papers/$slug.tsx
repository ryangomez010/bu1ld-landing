import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { PaperReader } from "@/components/member/PaperReader";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { NotFoundResource } from "@/components/member/NotFoundResource";
import { PageBackLink } from "@/components/member/PageBackLink";
import { projectLink } from "@/lib/app-paths";
import { useAuth } from "@/lib/auth";
import { fetchPaperBySlug, fetchPapers } from "@/lib/content";
import { paperNeighbors } from "@/lib/paper-review";
import { fetchProjects, relatedOpenProjectsForPaper } from "@/lib/projects";
import { pushRecentView } from "@/lib/recent-views";
import type { Paper, Project } from "@/lib/types";

export const Route = createFileRoute("/papers/$slug")({
  component: PaperDetailPage,
});

function PaperDetailPage() {
  return (
    <RequireMember>
      <PaperDetail />
    </RequireMember>
  );
}

function PaperDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchPaperBySlug(slug), fetchPapers(), fetchProjects()]).then(
      ([p, all, projects]) => {
        setPaper(p);
        setAllPapers(all);
        setRelatedProjects(p ? relatedOpenProjectsForPaper(p.tags, projects, 3) : []);
        setLoading(false);
      },
    );
  }, [slug]);

  useEffect(() => {
    if (!user || !paper) return;
    pushRecentView(user.id, {
      type: "paper",
      slug: paper.slug,
      title: paper.title,
      href: `/papers/${paper.slug}`,
    });
  }, [user, paper]);

  if (loading)
    return (
      <MemberLayout>
        <LoadingState />
      </MemberLayout>
    );
  if (!paper) {
    return (
      <MemberLayout>
        <NotFoundResource
          title="Review not found"
          body="This slug is not in the library — it may have been renamed. Browse Paper reviews for the current catalog."
          backTo="/papers"
          backLabel="Back to paper reviews"
        />
      </MemberLayout>
    );
  }

  const { prev, next } = paperNeighbors(allPapers, paper.slug);

  return (
    <MemberLayout>
      <PageBackLink to="/papers" label="Paper reviews" />
      {user ? <PaperReader paper={paper} userId={user.id} prev={prev} next={next} /> : null}

      <section className="mt-10 border-t border-border/50 pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Related open projects
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Move from reading into a scoped contribution thread when tags overlap with active work.
        </p>
        {relatedProjects.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {relatedProjects.map((project) => (
              <li key={project.id}>
                <Link
                  {...projectLink(project.slug)}
                  className="panel panel-interactive block rounded-sm p-4"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                    {project.status} · {project.team_count}/{project.capacity} slots
                  </p>
                  <h3 className="mt-1 font-display text-lg text-bone">{project.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-sm border border-border/40 px-4 py-4 text-sm text-muted-foreground">
            No open projects share tags with this review right now.{" "}
            <Link to="/projects" className="text-accent-blue hover:text-bone">
              Browse all projects →
            </Link>
          </p>
        )}
      </section>
    </MemberLayout>
  );
}
