import { Github } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

type Provider = "github" | "google";

const PROVIDERS: { id: Provider; label: string; icon?: React.ReactNode }[] = [
  { id: "github", label: "GitHub", icon: <Github className="h-4 w-4" /> },
  { id: "google", label: "Google" },
];

export function OAuthButtons() {
  const { signInWithOAuth, configured } = useAuth();

  if (!configured) return null;

  const onOAuth = async (provider: Provider) => {
    const { error } = await signInWithOAuth(provider);
    if (error) toast.error(error);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background/88 px-3 font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ id, label, icon }) => (
          <Button
            key={id}
            type="button"
            variant="outline"
            onClick={() => void onOAuth(id)}
            className="h-10 font-mono text-[10px] tracking-[0.12em] uppercase border-border/60 hover:border-bone/30 hover:bg-bone/5 transition-colors duration-200"
          >
            {icon}
            <span className={icon ? "ml-2" : ""}>{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
