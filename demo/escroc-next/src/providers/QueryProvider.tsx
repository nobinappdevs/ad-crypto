"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "14px" },
          success: { iconTheme: { primary: "rgb(68,160,141)", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
