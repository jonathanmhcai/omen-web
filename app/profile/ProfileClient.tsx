"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Calendar, ArrowLeftRight } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuthUser } from "../hooks/useAuthUser";
import { UserProfile, useUserProfile } from "../hooks/useUserProfile";

export default function ProfileClient() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { user: authUser } = useAuthUser();
  const { data: profile } = useUserProfile(authUser?.id);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return <AppShell>{null}</AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-4 px-3 text-2xl font-semibold">Profile</h1>
      {profile && (
        <div className="rounded-xl border border-border bg-card p-4">
          <ProfileHeader profile={profile} />
        </div>
      )}
    </AppShell>
  );
}

function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex flex-col gap-3">
      <Avatar
        avatarUrl={profile.avatar_url}
        displayName={profile.display_name}
        username={profile.username}
        size={72}
      />

      <div className="flex flex-col gap-0.5">
        {profile.display_name && (
          <span className="text-lg font-semibold">{profile.display_name}</span>
        )}
        {profile.username && (
          <span className="text-sm text-muted-foreground">
            @{profile.username}
          </span>
        )}
        {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}

        <div className="mt-2 flex items-center gap-4">
          <span className="flex items-baseline gap-1">
            <span className="text-sm font-semibold">
              {profile.follower_count}
            </span>
            <span className="text-xs text-muted-foreground">
              {profile.follower_count === 1 ? "follower" : "followers"}
            </span>
          </span>
          <span className="flex items-baseline gap-1">
            <span className="text-sm font-semibold">
              {profile.following_count}
            </span>
            <span className="text-xs text-muted-foreground">following</span>
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {profile.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {profile.markets_traded > 0 && (
            <span className="flex items-center gap-1">
              <ArrowLeftRight className="h-3 w-3" />
              {profile.markets_traded}{" "}
              {profile.markets_traded === 1 ? "market" : "markets"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const FALLBACK_AVATAR_COLORS = [
  "#E57373",
  "#4DB6AC",
  "#9575CD",
  "#FFB74D",
  "#4FC3F7",
  "#F06292",
  "#66BB6A",
  "#5C6BC0",
  "#FF8A65",
  "#26C6DA",
  "#BA68C8",
  "#AED581",
  "#7986CB",
  "#4DD0E1",
  "#EF5350",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Avatar({
  avatarUrl,
  displayName,
  username,
  size,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  username: string | null;
  size: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }

  const seed = username || displayName || "?";
  const bgColor =
    FALLBACK_AVATAR_COLORS[hashString(seed) % FALLBACK_AVATAR_COLORS.length];
  const initials = (displayName || username || "?")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
      }}
    >
      <span style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  );
}
