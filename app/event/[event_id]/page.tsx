import AppShell from "../../components/AppShell";
import RightSidebar from "../../components/RightSidebar";
import { EventDetail } from "../../components/event/EventDetail";

interface PageProps {
  params: Promise<{ event_id: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { event_id } = await params;
  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <EventDetail eventId={event_id} />
    </AppShell>
  );
}
