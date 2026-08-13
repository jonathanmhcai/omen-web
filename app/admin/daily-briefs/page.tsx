import type { Metadata } from "next";
import DailyBriefsClient from "./DailyBriefsClient";

export const metadata: Metadata = {
  title: "Daily Briefs",
};

export default function DailyBriefsPage() {
  return <DailyBriefsClient />;
}
