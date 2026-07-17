import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { setInstitutionalRole, updateMemberRole } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { InstitutionalRole, MemberRole, Profile } from "@/lib/types";

export function AdminMembersTab({
  members,
  actorId,
  institutionalRoles,
  onSaved,
}: {
  members: Profile[];
  actorId: string;
  institutionalRoles: Map<string, InstitutionalRole[]>;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Member list requires Supabase with admin profile read policy (phase4.sql). Run phase6.sql
        for role updates.
      </p>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members loaded.</p>;
  }

  const onRole = async (id: string, role: MemberRole) => {
    if (!actorId) {
      toast.error("Not signed in.");
      return;
    }
    const { error } = await updateMemberRole(actorId, id, role);
    if (error) toast.error(error);
    else {
      toast.success(`Role → ${role}`);
      onSaved();
    }
  };

  const onInstitutionalRole = async (id: string, role: InstitutionalRole, enabled: boolean) => {
    if (!actorId) return toast.error("Not signed in.");
    const { error } = await setInstitutionalRole(actorId, id, role, enabled);
    if (error) toast.error(error);
    else {
      toast.success(`${enabled ? "Granted" : "Revoked"} ${role.replace("_", " ")} access.`);
      onSaved();
    }
  };

  const filtered = members.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [m.full_name, m.role, ...(m.interests ?? [])].join(" ").toLowerCase();
    return hay.includes(q);
  });

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search members by name, role, interest…"
        className="mb-4 max-w-md font-mono text-sm"
      />
      <div className="overflow-x-auto rounded-sm border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Institutional access</th>
              <th className="p-3">Interests</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border/40 last:border-0 admin-row-hover">
                <td className="p-3 text-bone">{m.full_name || "—"}</td>
                <td className="p-3 font-mono text-[10px] uppercase">{m.role}</td>
                <td className="p-3">
                  <div className="flex max-w-xs flex-wrap gap-x-3 gap-y-2">
                    {(
                      [
                        "researcher",
                        "project_lead",
                        "reviewer",
                        "mentor",
                        "lab_lead",
                        "startup_founder",
                        "administrator",
                        "applicant",
                      ] as InstitutionalRole[]
                    ).map((role) => {
                      const enabled = institutionalRoles.get(m.id)?.includes(role) ?? false;
                      return (
                        <label
                          key={role}
                          className="flex cursor-pointer items-center gap-1.5 font-mono text-[8px] uppercase text-muted-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) =>
                              void onInstitutionalRole(m.id, role, event.target.checked)
                            }
                            className="accent-accent-green"
                          />
                          {role.replace("_", " ")}
                        </label>
                      );
                    })}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {m.interests?.slice(0, 3).join(", ") || "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {(["member", "project_lead", "admin"] as MemberRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        disabled={m.role === role}
                        onClick={() => void onRole(m.id, role)}
                        className="font-mono text-[8px] tracking-[0.12em] uppercase text-muted-foreground hover:text-bone disabled:opacity-40"
                      >
                        {role.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
