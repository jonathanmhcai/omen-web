import type { Metadata } from "next";
import InviteCodeDetailClient from "./InviteCodeDetailClient";

export const metadata: Metadata = {
  title: "Invite Code",
};

export default function InviteCodeDetailPage() {
  return <InviteCodeDetailClient />;
}
