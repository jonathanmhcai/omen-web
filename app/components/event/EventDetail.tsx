"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useEvent } from "../../hooks/useEvent";
import { EventHeader } from "./EventHeader";
import { EventChart } from "./EventChart";
import { EventDescription } from "./EventDescription";
import { EventTabs, Tab } from "./EventTabs";
import { MarketsTab } from "./MarketsTab";
import { AboutTab } from "./AboutTab";

type TabKey = "markets" | "about";
const TABS: Tab[] = [
  { key: "markets", label: "Markets" },
  { key: "about", label: "About" },
];

export function EventDetail({ slug }: { slug: string }) {
  const { data: event, isLoading, error } = useEvent(slug);
  const [activeTab, setActiveTab] = useState<TabKey>("markets");

  if (isLoading && !event) return <EventDetailSkeleton />;

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold text-foreground">
          {error ? "Error loading event" : "Event not found"}
        </p>
        {error && (
          <p className="text-sm text-muted-foreground">{error.message}</p>
        )}
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <EventHeader event={event} />
      <EventChart event={event} />
      {event.description && <EventDescription text={event.description} />}
      <div className="flex flex-col gap-4">
        <EventTabs
          tabs={TABS}
          active={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
        />
        {activeTab === "markets" ? (
          <MarketsTab event={event} />
        ) : (
          <AboutTab event={event} />
        )}
      </div>
    </article>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="flex gap-3 border-b border-border pb-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-5 w-11/12 rounded bg-muted" />
          <div className="h-5 w-2/3 rounded bg-muted" />
        </div>
        <div className="h-14 w-14 rounded-lg bg-muted" />
      </div>
      <div className="h-[260px] w-full rounded-md bg-muted" />
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-muted" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
