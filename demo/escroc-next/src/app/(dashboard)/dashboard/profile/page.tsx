import { Profile } from "@/components/dashboard/page/profile/Profile";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Profile Settings — Escroc" };

export default function ProfilePage() {
  return (
    <div className={dsx.page}>
      <Profile />
    </div>
  );
}
