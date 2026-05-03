import type { Metadata } from "next";
import AppShell from "../../components/AppShell";
import RightSidebar from "../../components/RightSidebar";
import { EventDetail } from "../../components/event/EventDetail";

export const metadata: Metadata = {
  title: "Event",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <EventDetail slug={slug} />
    </AppShell>
  );
}
