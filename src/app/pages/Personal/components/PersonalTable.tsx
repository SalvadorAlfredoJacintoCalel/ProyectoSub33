import { useMemo } from "react";
import type { Miembro, RangoItem, RolItem, Estado } from "@/types/personal";
import { formatDate } from "@/utils/format";

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
  onView: (m: Miembro) => void;
}

export function PersonalTable({ members, search, setSearch, filterRango, setFilterRango, filterEstado, setFilterEstado, page, setPage, totalPages, PAGE_SIZE, rangos, roles, onView, onEdit, onDelete }: TableProps) {
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !search || m.nombreCompleto.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q) || m.dpi.replace(/\D/g, "").includes(search.replace(/\D/g, ""));
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
            {["Código", "Nombre Completo", "DPI", "Rango", "Estado", "Teléfono", "Contacto Emergencia", "Tel. Emergencia", "Fecha de Ingreso"].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-3)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 && (
            <tr key="empty">
              <td colSpan={10} className="py-12 text-center text-sm" style={{ color: "var(--text-3)" }}>
                No se encontraron miembros.
              </td>
            </tr>
          )}
          {pageRows.map((m) => (
            <tr
              key={m.personalId}
              className="transition-colors"
              style={{ borderBottom: "1px solid var(--divider)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold">
                <button
                  onClick={() => onView(m)}
                  className="text-inherit hover:text-blue-600 cursor-pointer"
                  style={{ background: "none", border: "none", padding: 0, font: "inherit" }}
                >
                  {m.codigoBombero || "Sin código"}
                </button>
              </td>
              <td className="px-4 py-3 font-medium">
                <button
                  onClick={() => onView(m)}
                  className="text-inherit hover:text-blue-600 cursor-pointer"
                  style={{ background: "none", border: "none", padding: 0, font: "inherit" }}
                >
                  {m.nombreCompleto}
                </button>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono" style={{ color: "var(--text-2)" }}>
                {m.dpi}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                  {m.rangoNombre}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.estado === true ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                  {m.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                {m.telefono}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
                {m.contactoEmergenciaNombre}
              </td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                {m.contactoEmergenciaTelefono}
              </td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                {formatDate(m.fechaIngreso)}
              </td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}