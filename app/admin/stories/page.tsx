import type { Metadata } from "next";
import StoriesClient from "./StoriesClient";

export const metadata: Metadata = {
  title: "Stories",
};

export default function StoriesPage() {
  return <StoriesClient />;
}
