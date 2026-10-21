import { Link } from "@tanstack/react-router";
import { guideLink } from "@/lib/app-paths";
import { paperLearningLinks } from "@/lib/paper-learning-links";

export function PaperLearningLinks({ slugs }: { slugs?: readonly string[] }) {
  const lessons = paperLearningLinks(slugs);
  if (!lessons.length) return null;
  return (
    <section
      aria-label="Lessons for this review"
      className="mt-8 rounded-sm border border-border p-5"
    >
      <h2 className="font-display text-xl">Prepare for this paper</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Public lessons for the methods and evidence discussed in this review.
      </p>
      <ul className="mt-3 space-y-2">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link {...guideLink(lesson.slug)} className="text-sm text-accent-blue underline">
              {lesson.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
