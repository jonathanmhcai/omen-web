import type { Metadata } from "next";
import UserDetailClient from "./UserDetailClient";

export const metadata: Metadata = {
  title: "User",
};

export default function UserDetailPage() {
  return <UserDetailClient />;
}
