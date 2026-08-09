"use client";

import { Button } from "@/components/ui/button";
import ModalShell from "./ModalShell";

/**
 * Product-state notice shown when someone taps a trade affordance (the
 * event-page outcome buttons today). Web trading isn't built yet for
 * ANY user, so this is deliberately NOT gated on useTradingEnabled —
 * redeemed mobile traders see it too. Points at the X account for
 * launch updates.
 */
export default function TradingUnavailableModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell open={open} onClose={onClose} title="Trading isn't available yet">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Trading on the web is coming soon. Follow @OmenTrading on X for
          updates.
        </p>
        <Button asChild className="w-full">
          <a href="https://x.com/OmenTrading" target="_blank" rel="noopener noreferrer">
            Follow on X
          </a>
        </Button>
      </div>
    </ModalShell>
  );
}
