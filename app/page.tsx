"use client";

import dynamic from "next/dynamic";
import ComingSoon from "./ComingSoon";

const MapPage = dynamic(() => import("./MapPage"), { ssr: false });

export default function Page() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-55"
      >
        <MapPage demoMode />
      </div>
      <div className="relative z-10">
        <ComingSoon />
      </div>
    </div>
  );
}
