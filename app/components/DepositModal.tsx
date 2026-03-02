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
import BuyWithCoinbaseTab from "./BuyWithCoinbaseTab";

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

        <Tabs defaultValue="coinbase">
          <TabsList>
            <TabsTrigger value="coinbase">Coinbase</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="coinbase">
            <BuyWithCoinbaseTab onClose={onClose} />
          </TabsContent>

          <TabsContent value="crypto">
            <Tabs defaultValue="evm">
              <TabsList>
                {(Object.keys(networkLabels) as Network[]).map((n) => (
                  <TabsTrigger key={n} value={n}>
                    {networkLabels[n]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {(Object.keys(networkLabels) as Network[]).map((n) => (
                <TabsContent key={n} value={n} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    {depositInstructions[n]}
                  </p>
                  <NetworkContent address={addresses[n]} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
