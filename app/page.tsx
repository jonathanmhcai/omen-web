"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import ComingSoon from "./ComingSoon";

const MapPage = dynamic(() => import("./MapPage"), { ssr: false });

const BYPASS_KEY = "SITUATIONMONITOR";

function Gate() {
  const searchParams = useSearchParams();
  const unlocked = searchParams.get("key") === BYPASS_KEY;

  if (unlocked) return <MapPage />;

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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Gate />
    </Suspense>
  );
}
