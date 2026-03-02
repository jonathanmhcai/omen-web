"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { type DepositAddressesResponse } from "../hooks/useDepositAddresses";
import BuyWithCardTab from "./BuyWithCardTab";

type Network = "evm" | "svm" | "btc";

const networkLabels: Record<Network, string> = {
  evm: "Ethereum",
  svm: "Solana",
  btc: "Bitcoin",
};

const depositInstructions: Record<Network, string> = {
  evm: "Send a minimum of $10 USDC on Ethereum Mainnet, Base, Optimism, Polygon, Arbitrum, or BNB Smart Chain",
  svm: "Send a minimum of $10 USDC on Solana",
  btc: "Send a minimum of $10 in BTC on Bitcoin",
};

interface DepositModalProps {
  addresses: DepositAddressesResponse["addresses"];
  onClose: () => void;
}

function NetworkContent({ address }: { address: string }) {
  function handleCopy() {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded-xl bg-white p-4">
        <QRCodeSVG value={address} size={200} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
        <span className="font-mono text-xs truncate flex-1">{address}</span>
        <button
          onClick={handleCopy}
          className="cursor-pointer rounded-md p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      <Button onClick={handleCopy}>Copy Address</Button>
    </div>
  );
}

export default function DepositModal({ addresses, onClose }: DepositModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit</DialogTitle>
          <DialogDescription className="sr-only">
            Deposit funds to your account
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="card">
          <TabsList>
            <TabsTrigger value="card">Card / Apple Pay</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <BuyWithCardTab evmAddress={addresses.evm} onClose={onClose} />
          </TabsContent>

          <TabsContent value="crypto">
            {(Object.keys(networkLabels) as Network[]).map((n) => (
              <div key={n} className="flex flex-col gap-4 mb-6 last:mb-0">
                <h3 className="text-sm font-medium">{networkLabels[n]}</h3>
                <p className="text-sm text-muted-foreground">
                  {depositInstructions[n]}
                </p>
                <NetworkContent address={addresses[n]} />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
