import type { Metadata } from "next";
import StoryClient from "./StoryClient";

export const metadata: Metadata = {
  title: "Story",
};

export default function StoryPage() {
  return <StoryClient />;
}
