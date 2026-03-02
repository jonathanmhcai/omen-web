"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  successDescription?: string;
  errorMessage?: string;
  children: React.ReactNode;
}

export default function ModalShell({
  open,
  onClose,
  title,
  isPending = false,
  isSuccess = false,
  isError = false,
  loadingMessage = "Processing...",
  successMessage = "Success",
  successDescription,
  errorMessage,
  children,
}: ModalShellProps) {
  const showOverlay = isPending || isSuccess || isError;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => {
            if (isPending) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isPending) e.preventDefault();
          }}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex w-full max-w-sm flex-col gap-4 translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg duration-200"
        >
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {title}
            </DialogPrimitive.Description>
          </div>

          {!isPending && (
            <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 cursor-pointer rounded-md p-1.5 text-zinc-400 opacity-70 transition-opacity hover:opacity-100 hover:text-foreground focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}

          {showOverlay && (
            <>
              {isPending && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {loadingMessage}
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <div className="text-center">
                    <p className="text-lg font-medium">{successMessage}</p>
                    {successDescription && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {successDescription}
                      </p>
                    )}
                  </div>
                  <Button onClick={onClose}>Close</Button>
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <div className="text-center">
                    <p className="text-lg font-medium">Something went wrong</p>
                    {errorMessage && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                  <Button onClick={onClose}>Close</Button>
                </div>
              )}
            </>
          )}
          <div className={cn(showOverlay && "hidden")}>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
