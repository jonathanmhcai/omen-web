import type { Metadata } from "next";
import InviteCodesClient from "./InviteCodesClient";

export const metadata: Metadata = {
  title: "Invite Codes",
};

export default function InviteCodesPage() {
  return <InviteCodesClient />;
}
