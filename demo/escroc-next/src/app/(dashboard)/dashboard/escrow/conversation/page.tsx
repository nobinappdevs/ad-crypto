import { Suspense } from "react";
import { Conversation } from "@/components/dashboard/page/escrow/Conversation";

export const metadata = { title: "Escrow Conversation — Escroc" };

export default function ConversationPage() {
  return (
    <Suspense>
      <Conversation />
    </Suspense>
  );
}
