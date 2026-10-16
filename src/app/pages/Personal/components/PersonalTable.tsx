import { useMemo, memo } from "react";
import { Users } from "lucide-react";
import type { Miembro, RangoItem, RolItem, Estado } from "@/types/personal";
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Badge } from "@/app/components/ui/badge";

interface TableProps {
  members: Miembro[];
  search: string;
  setSearch: (s: string) => void;
  filterRango: string;
  setFilterRango: (r: string) => void;
  filterEstado: Estado | "";
  setFilterEstado: (e: Estado | "") => void;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  PAGE_SIZE: number;
  rangos: RangoItem[];
  roles: RolItem[];
  onRowClick: (m: Miembro) => void;
}

interface RowProps {
  m: Miembro;
  onRowClick: (m: Miembro) => void;
  index: number;
}

const MemoizedRow = memo(function MemoizedRow({ m, onRowClick, index }: RowProps) {
  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{
        borderBottom: "1px solid var(--divider)",
        animation: "fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
        animationDelay: `${index * 40}ms`,
      }}
      onClick={() => onRowClick(m)}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold" style={{ color: "var(--brand-600)" }}>
        {m.codigoBombero || "Sin código"}
      </td>
      <td className="px-4 py-3 font-medium" style={{ color: "var(--text-1)" }}>
        {m.nombreCompleto}
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono" style={{ color: "var(--text-2)" }}>
        {m.dpi}
      </td>
      <td className="px-4 py-3">
        <Badge variant="info" size="sm">
          {m.rangoNombre || "Sin rango"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={m.estado ? "success" : "default"} size="sm" dot>
          {m.estado ? "Activo" : "Inactivo"}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
        {m.telefono}
      </td>
      <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
        {formatDate(m.fechaIngreso)}
      </td>
    </tr>
  );
});

export function PersonalTable({
  members,
  search,
  filterRango,
  filterEstado,
  page,
  PAGE_SIZE,
  onRowClick,
}: TableProps) {
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        m.nombreCompleto.toLowerCase().includes(q) ||
        m.dpi.replace(/\D/g, "").includes(search.replace(/\D/g, ""));
      const matchRango = !filterRango || m.rangoNombre === filterRango;
      const matchEstado = !filterEstado || (m.estado ? "Activo" : "Inactivo") === filterEstado;
      return matchSearch && matchRango && matchEstado;
    });
  }, [members, search, filterRango, filterEstado]);

  const totalPagesCalc = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPagesCalc);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr key="header" style={{ borderBottom: "1px solid var(--border)" }}>
            {["Código", "Nombre Completo", "DPI", "Rango", "Estado", "Teléfono", "Fecha de Ingreso"].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-3)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 && (
            <tr key="empty">
              <td colSpan={7}>
                <EmptyState
                  icon={Users}
                  title="No se encontraron miembros"
                  description="No hay registros que coincidan con los filtros de búsqueda seleccionados."
                />
              </td>
            </tr>
          )}
          {pageRows.map((m, index) => (
            <MemoizedRow key={m.personalId} m={m} onRowClick={onRowClick} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
