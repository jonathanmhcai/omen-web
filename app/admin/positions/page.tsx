import type { Metadata } from "next";
import PositionsClient from "./PositionsClient";

export const metadata: Metadata = {
  title: "Positions",
};

export default function PositionsPage() {
  return <PositionsClient />;
}
