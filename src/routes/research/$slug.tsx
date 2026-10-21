import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PUBLIC_RESEARCH_PORTFOLIO } from "@/data/research-portfolio";

const aliases: Record<string, string> = {
  "apen-episodic-predictive-memory": "apen-synthica",
  "fabric-inference-memory": "fabric-induced-memory",
  ripii: "ripii-world-models",
  "kyrlov-jepa": "krylov-jepa",
  "space-jepa-2": "space-jepa",
};
export const Route = createFileRoute("/research/$slug")({
  beforeLoad: ({ params }) => {
    const slug = aliases[params.slug] ?? params.slug;
    if (!PUBLIC_RESEARCH_PORTFOLIO.some((record) => record.slug === slug)) throw notFound();
    throw redirect({ to: "/research-atlas/$slug", params: { slug }, statusCode: 301 });
  },
});
