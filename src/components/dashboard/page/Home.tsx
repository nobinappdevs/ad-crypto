"use client";

import { ClipboardList, LifeBuoy, Wallet, Wallet2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dsx, Panel, PanelHeader, StatCard } from "@/components/dashboard/ui";

export function DashboardHome() {
  const { t } = useLang();

  return (
    <div className={dsx.page}>
      <h1 className="text-[24px]! sm:text-[28px]!">{t("dashboard.welcomeTitle")}</h1>
      <p className="mt-1">{t("dashboard.welcomeSubtitle")}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dashboard.statTotalBalance")} value="$0.00" icon={<Wallet size={18} />} />
        <StatCard label={t("dashboard.statActiveWallets")} value="0" icon={<Wallet2 size={18} />} />
        <StatCard
          label={t("dashboard.statPendingOrders")}
          value="0"
          icon={<ClipboardList size={18} />}
        />
        <StatCard
          label={t("dashboard.statSupportTickets")}
          value="0"
          icon={<LifeBuoy size={18} />}
        />
      </div>

      <Panel className="mt-6">
        <PanelHeader>
          <h2 className={dsx.title}>{t("dashboard.recentActivityTitle")}</h2>
        </PanelHeader>
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <h5>{t("dashboard.emptyActivityTitle")}</h5>
          <p className="max-w-sm">{t("dashboard.emptyActivityText")}</p>
        </div>
      </Panel>
    </div>
  );
}
