"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppShell from "../components/AppShell";
import { useCookieString } from "../hooks/useCookieString";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ready, authenticated, user, logout, exportWallet } = usePrivy();
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);
  const [darkMode, setDarkMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const DELETE_PHRASE = "delete my account";
  const canDelete =
    deleteConfirm.trim().toLowerCase() === DELETE_PHRASE && !deleting;

  // Reset the confirm input whenever the dialog closes.
  useEffect(() => {
    if (!deleteOpen) setDeleteConfirm("");
  }, [deleteOpen]);

  useEffect(() => {
    const check = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const setDarkModeValue = useCallback((next: boolean) => {
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    } catch {
      // Account may already be deleted — proceed with cleanup
    }
    await logout().catch(() => {});
    queryClient.clear();
    router.replace("/");
    toast.success("Account deleted");
  }, [sessionToken, logout, queryClient, router]);

  const signInMethods = useMemo(
    () => deriveSignInMethods(user?.linkedAccounts),
    [user?.linkedAccounts]
  );

  const emailAddress =
    user?.email?.address ?? user?.google?.email ?? user?.apple?.email ?? null;

  if (!ready || !authenticated) {
    return <AppShell>{null}</AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-4 px-3 text-2xl font-semibold">Settings</h1>

      <div className="flex flex-col gap-4">
        {!user?.wallet && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold">No Wallet</h2>
            <p className="text-xs text-muted-foreground">
              You don&apos;t have a wallet created yet. Sign up through the
              mobile app to get started.
            </p>
            <a
              href="https://omen.trading"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline"
            >
              Download the app at omen.trading
            </a>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <InfoRow label="Sign-in method">
            {signInMethods.length > 0 ? (
              <div className="flex flex-col items-end gap-1.5">
                {signInMethods.map((m) => (
                  <div
                    key={m.type}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <span>{m.label}</span>
                    <m.Icon className="h-4 w-4" />
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </InfoRow>

          {emailAddress && (
            <InfoRow label="Email">
              <span className="text-sm">{emailAddress}</span>
            </InfoRow>
          )}

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span>Dark mode</span>
            <Switch checked={darkMode} onCheckedChange={setDarkModeValue} />
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-between gap-4 border-t border-border px-4 py-3 text-left text-sm hover:bg-accent"
          >
            Log out
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Danger zone
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {user?.wallet && (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">Export private key</span>
                  <span className="text-xs text-muted-foreground">
                    Caution: anyone with this key controls your wallet.
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={exportWallet}>
                  Export
                </Button>
              </div>
            )}
            <button
              onClick={() => setDeleteOpen(true)}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-accent",
                user?.wallet && "border-t border-border"
              )}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-red-500">
                  Delete account
                </span>
                <span className="text-xs text-muted-foreground">
                  Permanently delete your Omen account and all data.
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your data
              including posts, positions, and activity. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label htmlFor="delete-confirm" className="text-sm">
              Type{" "}
              <span className="font-mono font-medium">{DELETE_PHRASE}</span> to
              confirm.
            </label>
            <input
              id="delete-confirm"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              disabled={deleting}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!canDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border px-4 py-3 first:border-t-0">
      <span className="text-sm">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

type SignInMethod = {
  type: "google_oauth" | "email" | "apple_oauth";
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const SIGN_IN_METHODS: SignInMethod[] = [
  { type: "google_oauth", label: "Google", Icon: GoogleIcon },
  { type: "email", label: "Email", Icon: Mail },
  { type: "apple_oauth", label: "Apple", Icon: AppleIcon },
];

function deriveSignInMethods(
  linkedAccounts: { type: string }[] | undefined
): SignInMethod[] {
  if (!linkedAccounts) return [];
  const types = new Set(linkedAccounts.map((a) => a.type));
  return SIGN_IN_METHODS.filter((m) => types.has(m.type));
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36-4.88-5.03-4.16-12.69 1.39-12.97 1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
