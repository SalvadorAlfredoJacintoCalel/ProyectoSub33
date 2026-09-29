import { useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react";

type RangoItem = {
  id: number;
  nombre: string;
};

type RolItem = {
  id: number;
  nombre: string;
};

interface Miembro {
  id: string;
  codigo: string;
  nombre: string;
  dpi: string;
  rangoId: number;
  rango: string;
  estado: "Activo" | "Inactivo";
  telefono: string;
  contactoEmergencia: string;
  telEmergencia: string;
  fechaIngreso: string;
}

interface FormState {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  dpi: string;
  fechaNacimiento: string;
  codigo: string;
  rangoId: number;
  fechaIngreso: string;
  telefono: string;
  estado: "Activo" | "Inactivo";
  contactoEmergencia: string;
  telEmergencia: string;
  usuario: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  rolId: number;
}

interface TableProps {
  members: Miembro[];
  search: string;
  setSearch: (s: string) => void;
  filterRango: string;
  setFilterRango: (r: string) => void;
  filterEstado: "Activo" | "Inactivo" | "";
  setFilterEstado: (e: "Activo" | "Inactivo" | "") => void;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  PAGE_SIZE: number;
  rangos: RangoItem[];
  roles: RolItem[];
  onView: (m: Miembro) => void;
  onEdit: (m: Miembro) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PersonalTable({ members, search, setSearch, filterRango, setFilterRango, filterEstado, setFilterEstado, page, setPage, totalPages, PAGE_SIZE, rangos, roles, onView, onEdit, onDelete }: TableProps) {
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !search || m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q) || m.dpi.replace(/\D/g, "").includes(search.replace(/\D/g, ""));
      const matchRango = !filterRango || m.rango === filterRango;
      const matchEstado = !filterEstado || m.estado === filterEstado;
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
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Código", "Nombre Completo", "DPI", "Rango", "Estado", "Teléfono", "Contacto Emergencia", "Tel. Emergencia", "Fecha de Ingreso", "Acciones"].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-3)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 && (
            <tr>
              <td colSpan={10} className="py-12 text-center text-sm" style={{ color: "var(--text-3)" }}>
                No se encontraron miembros.
              </td>
            </tr>
          )}
          {pageRows.map((m) => (
            <tr
              key={m.id}
              className="transition-colors"
              style={{ borderBottom: "1px solid var(--divider)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold" style={{ color: "var(--text-2)" }}>
                {m.codigo}
              </td>
              <td className="px-4 py-3 font-medium" style={{ color: "var(--text-1)" }}>
                {m.nombre}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono" style={{ color: "var(--text-2)" }}>
                {m.dpi}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                  {m.rango}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.estado === "Activo" ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                  {m.estado}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                {m.telefono}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
                {m.contactoEmergencia}
              </td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                {m.telEmergencia}
              </td>
              <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                {formatDate(m.fechaIngreso)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onView(m)}
                    className="rounded p-1.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    style={{ color: "var(--text-3)" }}
                    title="Ver"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onEdit(m)}
                    className="rounded p-1.5 transition-colors hover:bg-amber-50 hover:text-amber-600"
                    style={{ color: "var(--text-3)" }}
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(m.id)}
                    className="rounded p-1.5 transition-colors hover:bg-red-50 hover:text-red-600"
                    style={{ color: "var(--text-3)" }}
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useTableMemo(members, search, filterRango, filterEstado, PAGE_SIZE) {
  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !search || m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q) || m.dpi.replace(/\D/g, "").includes(search.replace(/\D/g, ""));
    const matchRango = !filterRango || m.rango === filterRango;
    const matchEstado = !filterEstado || m.estado === filterEstado;
    return matchSearch && matchRango && matchEstado;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { filtered, totalPages, safePage, pageRows };
}