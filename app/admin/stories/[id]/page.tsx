import type { Metadata } from "next";
import StoryDetailClient from "./StoryDetailClient";

export const metadata: Metadata = {
  title: "Story",
};

export default function StoryDetailPage() {
  return <StoryDetailClient />;
}
