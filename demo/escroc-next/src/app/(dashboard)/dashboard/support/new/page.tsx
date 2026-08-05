import { CreateTicket } from "@/components/dashboard/page/support/CreateTicket";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Add New Ticket — Escroc" };

export default function CreateTicketPage() {
  return (
    <div className={dsx.page}>
      <CreateTicket />
    </div>
  );
}
