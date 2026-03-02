"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { type DepositAddressesResponse } from "../hooks/useDepositAddresses";
import ModalShell from "./ModalShell";
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
      <div className="flex justify-center rounded-xl border border-border bg-gray-100 p-5">
        <QRCodeSVG value={address} size={176} />
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
  const [popupOpen, setPopupOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <ModalShell
      open
      onClose={onClose}
      title="Deposit"
      isPending={popupOpen}
      isSuccess={isSuccess}
      loadingMessage="Waiting for Coinbase..."
      successMessage="Deposit submitted"
      successDescription="Your balance will update shortly."
    >
      <Tabs defaultValue="coinbase">
        <TabsList>
          <TabsTrigger value="coinbase">Coinbase</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
        </TabsList>

        <TabsContent value="coinbase">
          <BuyWithCoinbaseTab
            onPopupOpened={() => setPopupOpen(true)}
            onSuccess={() => {
              setPopupOpen(false);
              setIsSuccess(true);
            }}
            onCancel={() => setPopupOpen(false)}
          />
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
    </ModalShell>
  );
}
