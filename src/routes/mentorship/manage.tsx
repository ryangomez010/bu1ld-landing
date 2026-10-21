import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  decideMentorshipRequest,
  fetchMyMentorProfile,
  fetchMyMentorshipRequests,
  saveMentorProfile,
} from "@/lib/mentorship";
import { isMentor } from "@/lib/roles";
import type { MentorProfile, MentorshipRequest } from "@/lib/types";

export const Route = createFileRoute("/mentorship/manage")({ component: MentorManagePage });
function MentorManagePage() {
  return (
    <RequireMember>
      <MentorManageContent />
    </RequireMember>
  );
}
function MentorManageContent() {
  const { user, profile } = useAuth();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loadVersion = useRef(0);
  const canManage = isMentor(profile);
  const [note, setNote] = useState("");
  const userId = user?.id;
  const load = useCallback(() => {
    if (!userId || !canManage) return;
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError(null);
    setMentor(null);
    setRequests([]);
    void Promise.all([fetchMyMentorProfile(userId), fetchMyMentorshipRequests(userId)]).then(
      ([m, r]) => {
        if (version !== loadVersion.current) return;
        setMentor(
          m ?? {
            mentor_id: userId,
            headline: "",
            expertise: [],
            availability_note: "",
            monthly_capacity: 1,
            accepting_requests: false,
            visible: false,
          },
        );
        setRequests(r);
        setLoading(false);
      },
      () => {
        if (version !== loadVersion.current) return;
        setLoadError(
          "Mentor settings could not be loaded. Your saved availability has not changed.",
        );
        setLoading(false);
      },
    );
  }, [userId, canManage]);
  useEffect(() => {
    load();
    return () => {
      loadVersion.current += 1;
    };
  }, [load]);
  if (!isMentor(profile))
    return (
      <MemberLayout title="Mentorship" eyebrow="access required">
        <p className="text-muted-foreground">
          Mentor availability can only be managed by an administrator-granted mentor or lab lead.
        </p>
      </MemberLayout>
    );
  if (loadError)
    return (
      <MemberLayout title="Mentorship" eyebrow="availability & requests">
        <div role="alert">
          <p>{loadError}</p>
          <Button type="button" onClick={load} className="mt-4">
            Retry
          </Button>
        </div>
      </MemberLayout>
    );
  if (loading || !mentor)
    return (
      <MemberLayout title="Mentorship" eyebrow="loading">
        Loading mentor settings…
      </MemberLayout>
    );
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await saveMentorProfile(mentor);
      if (error) toast.error(error);
      else toast.success("Mentor availability saved.");
    } catch {
      toast.error("Availability could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const decide = async (id: string, status: "accepted" | "declined") => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await decideMentorshipRequest(id, status, note);
      if (error) toast.error(error);
      else {
        toast.success(`Request ${status}.`);
        setNote("");
        load();
      }
    } catch {
      toast.error("The decision could not be confirmed. Reload before trying again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <MemberLayout title="Mentor operations" eyebrow="availability & requests">
      <div className="max-w-2xl space-y-3">
        <Input
          aria-label="How you can help"
          value={mentor.headline}
          onChange={(e) => setMentor({ ...mentor, headline: e.target.value })}
          placeholder="How you can help"
        />
        <Input
          aria-label="Expertise"
          value={mentor.expertise.join(", ")}
          onChange={(e) => setMentor({ ...mentor, expertise: e.target.value.split(",") })}
          placeholder="Expertise, comma separated"
        />
        <Textarea
          aria-label="Availability and boundaries"
          value={mentor.availability_note}
          onChange={(e) => setMentor({ ...mentor, availability_note: e.target.value })}
          placeholder="Availability and boundaries"
        />
        <Input
          type="number"
          min="0"
          max="20"
          aria-label="Monthly conversation capacity"
          value={mentor.monthly_capacity}
          onChange={(e) => setMentor({ ...mentor, monthly_capacity: Number(e.target.value) })}
        />
        <label className="block text-sm">
          <input
            type="checkbox"
            checked={mentor.visible}
            onChange={(e) => setMentor({ ...mentor, visible: e.target.checked })}
          />{" "}
          Show in member directory
        </label>
        <label className="block text-sm">
          <input
            type="checkbox"
            checked={mentor.accepting_requests}
            onChange={(e) => setMentor({ ...mentor, accepting_requests: e.target.checked })}
          />{" "}
          Accept requests
        </label>
        <Button type="button" disabled={busy} onClick={() => void save()}>
          Save availability
        </Button>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-2xl">Incoming requests</h2>
        <Textarea
          aria-label="Decision note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-4 max-w-2xl"
          placeholder="Optional decision note"
        />
        {requests
          .filter((request) => request.mentor_id === user?.id && request.status === "pending")
          .map((request) => (
            <article key={request.id} className="mt-3 rounded-sm border border-border/50 p-4">
              <p className="font-display text-lg">
                {request.requester_name ?? "Member"} · {request.topic}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{request.goal}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void decide(request.id, "accepted")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  variant="outline"
                  onClick={() => void decide(request.id, "declined")}
                >
                  Decline
                </Button>
              </div>
            </article>
          ))}
      </section>
    </MemberLayout>
  );
}
