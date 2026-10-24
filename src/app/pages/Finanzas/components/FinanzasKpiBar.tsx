import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Gift, Scale } from "lucide-react";
import type { ResumenFinanciero } from "@/types/finanzas";

const fmt = (n: number) =>
  "Q " + n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function KpiCard({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl bg-[var(--bg-card)] p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.05)" }}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-3)]">{label}</p>
        <p className="text-xl font-bold leading-tight text-[var(--text-1)]">{fmt(value)}</p>
      </div>
    </div>
  );
}

export function FinanzasKpiBar({ resumen }: { resumen: ResumenFinanciero | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<TrendingUp size={20} />}
        label="Total Ingresos"
        value={resumen?.totalIngresos ?? 0}
        iconClass="bg-green-50 text-green-600"
      />
      <KpiCard
        icon={<TrendingDown size={20} />}
        label="Total Gastos"
        value={resumen?.totalGastos ?? 0}
        iconClass="bg-red-50 text-red-600"
      />
      <KpiCard
        icon={<Gift size={20} />}
        label="Total Donaciones"
        value={resumen?.totalDonaciones ?? 0}
        iconClass="bg-amber-50 text-amber-600"
      />
      <KpiCard
        icon={<Scale size={20} />}
        label="Balance"
        value={resumen?.balance ?? 0}
        iconClass="bg-blue-50 text-blue-600"
      />
    </div>
  );
}
