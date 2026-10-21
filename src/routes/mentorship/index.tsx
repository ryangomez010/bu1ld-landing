import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { fetchMentors, fetchMyMentorshipRequests, requestMentorship } from "@/lib/mentorship";
import { isMentor } from "@/lib/roles";
import type { MentorProfile, MentorshipRequest } from "@/lib/types";

export const Route = createFileRoute("/mentorship/")({ component: MentorshipPage });

function MentorshipPage() {
  return (
    <RequireMember>
      <MentorshipContent />
    </RequireMember>
  );
}

function MentorshipContent() {
  const { user, profile } = useAuth();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loadVersion = useRef(0);
  const [selected, setSelected] = useState<MentorProfile | null>(null);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [availability, setAvailability] = useState("");
  const userId = user?.id;
  const load = useCallback(() => {
    if (!userId) return;
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError(null);
    setMentors([]);
    setRequests([]);
    void Promise.all([fetchMentors(), fetchMyMentorshipRequests(userId)]).then(
      ([nextMentors, nextRequests]) => {
        if (version !== loadVersion.current) return;
        setMentors(nextMentors.filter((mentor) => mentor.mentor_id !== userId));
        setRequests(nextRequests);
        setLoading(false);
      },
      () => {
        if (version !== loadVersion.current) return;
        setLoadError("Mentorship could not be loaded. Your saved requests have not changed.");
        setLoading(false);
      },
    );
  }, [userId]);
  useEffect(() => {
    setSelected(null);
    load();
    return () => {
      loadVersion.current += 1;
    };
  }, [load]);
  const submit = async () => {
    if (!user || !selected || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await requestMentorship({
        mentorId: selected.mentor_id,
        requesterId: user.id,
        topic,
        goal,
        availabilityNote: availability,
      });
      if (error) return toast.error(error);
      toast.success("Request sent. The mentor can now accept or decline it.");
      setSelected(null);
      setTopic("");
      setGoal("");
      setAvailability("");
      load();
    } catch {
      toast.error("The request could not be confirmed. Reload your requests before trying again.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <MemberLayout title="Mentorship" eyebrow="scoped guidance, real capacity">
      <p className="-mt-4 mb-6 max-w-3xl text-muted-foreground">
        Request a bounded conversation from an opted-in mentor. A request is not a match until the
        mentor accepts it; neither party’s private notes are visible to other members.
      </p>
      {isMentor(profile) ? (
        <Link
          to="/mentorship/manage"
          className="mb-6 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-accent-green"
        >
          Manage mentor availability →
        </Link>
      ) : null}
      {loadError ? (
        <div role="alert" className="mb-6 rounded-sm border border-border p-4">
          <p>{loadError}</p>
          <Button type="button" variant="outline" onClick={load} className="mt-3">
            Retry
          </Button>
        </div>
      ) : null}
      {selected ? (
        <section className="mb-8 max-w-2xl rounded-sm border border-accent-blue/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Request {selected.full_name ?? "mentor"}</h2>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
          <Input
            aria-label="Specific topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={120}
            className="mt-4"
            placeholder="Specific topic"
          />
          <Textarea
            aria-label="Conversation goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={2000}
            className="mt-3"
            rows={4}
            placeholder="What outcome do you want from this conversation? (40+ characters)"
          />
          <Input
            aria-label="Availability and timezone"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            maxLength={500}
            className="mt-3"
            placeholder="Your availability and timezone"
          />
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="mt-4"
          >
            {submitting ? "Sending…" : "Send scoped request"}
          </Button>
        </section>
      ) : null}
      <section>
        <h2 className="font-display text-2xl">Available mentors</h2>
        {loading ? (
          <ListSkeleton rows={3} />
        ) : loadError ? null : mentors.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {mentors.map((mentor) => (
              <article key={mentor.mentor_id} className="panel p-5">
                <h3 className="font-display text-xl">{mentor.full_name ?? "Mentor"}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{mentor.headline}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {mentor.expertise.join(" · ") || "Expertise to be discussed"}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{mentor.availability_note}</p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSelected(mentor)}
                >
                  Request mentorship
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No mentors are accepting requests"
            body="Mentors appear only after they opt in, publish their availability, and set capacity. Check back when an actual opening is available."
          />
        )}
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl">Your requests</h2>
        {loading || loadError ? null : requests.filter((request) => request.requester_id === userId)
            .length ? (
          <div className="mt-4 grid gap-px border border-border/40 bg-border/40">
            {requests
              .filter((request) => request.requester_id === user?.id)
              .map((request) => (
                <div key={request.id} className="bg-background/75 p-4">
                  <p className="font-display text-lg">
                    {request.mentor_name ?? "Mentor"} · {request.topic}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {request.status}
                    {request.decision_note ? ` · ${request.decision_note}` : ""}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No mentorship requests yet.</p>
        )}
      </section>
    </MemberLayout>
  );
}
