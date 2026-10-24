import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, Search, Users, UserCheck, UserX, ChevronDown, Printer, Pencil, History, FileText, Info, AlertTriangle } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { PersonalForm } from "@/app/pages/Personal/components/PersonalForm";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { EmptyState } from "@/app/components/ui/empty-state";
import {
  getRangos,
  crearRango,
  getRoles,
  crearRol,
  getPersonal,
  getPersonalById,
  getEstadisticasPersonal,
  registrarPersonal,
  actualizarPersonal,
  eliminarPersonal,
  type CrearPersonalDto,
  type ActualizarPersonalDto,
} from "../../../services/personalService";
import type { Estado, Miembro, FormState, RangoItem, RolItem } from "@/types/personal";
import { formatDate } from "@/utils/format";
import { emptyFormState, miembroToForm, personalResponseToForm, personalResponseToMiembro } from "@/utils/formHelpers";
import { useAlert } from "@/app/components/ui/AlertContext";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { usePermisos } from "@/hooks/usePermisos";

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND = "var(--brand-600)";
const PAGE_SIZE = 8;

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
}

// ── Detail Info ────────────────────────────────────────────────────────────────
function MemberInfo({ member }: { member: Miembro }) {
  const fields: { label: string; value: string }[] = [
    { label: "Código Bombero", value: member.codigoBombero || "Sin asignar" },
    { label: "DPI", value: member.dpi },
    { label: "Rango", value: member.rangoNombre || "—" },
    { label: "Teléfono", value: member.telefono || "—" },
    { label: "Fecha de Ingreso", value: formatDate(member.fechaIngreso) },
    { label: "Contacto de Emergencia", value: member.contactoEmergenciaNombre || "—" },
    { label: "Tel. de Emergencia", value: member.contactoEmergenciaTelefono || "—" },
    { label: "Usuario del Sistema", value: member.username || member.usuario?.username || "Sin cuenta" },
    { label: "Rol del Sistema", value: member.rolNombre || member.usuario?.rol || "Sin rol" },
    { label: "Acceso al Sistema", value: member.username || member.usuario ? "Sí" : "No" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px 24px" }}>
      {fields.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>
            {label}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function PersonalPage() {
  const { personal: permisosPersonal } = usePermisos();

  const [members, setMembers] = useState<Miembro[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);
  const [filterRango, setFilterRango] = useState<number | "">("");
  const [filterEstado, setFilterEstado] = useState<Estado | "">("Activo");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0 });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { draft, savedAt, online, save, clear } = useFormDraft<FormState>("personal.create");

  useEffect(() => {
    if (!editModalOpen || editingId !== null) return;
    if (JSON.stringify(form) === JSON.stringify(emptyFormState())) {
      clear();
      return;
    }
    save(form);
  }, [form, editModalOpen, editingId, save, clear]);

  const [credOpen, setCredOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [editingHasAccess, setEditingHasAccess] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Miembro | null>(null);
  const detailFetchRef = useRef<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast, alert } = useAlert();
  const [rangos, setRangos] = useState<RangoItem[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [isLoadingRangos, setIsLoadingRangos] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [nuevoRangoOpen, setNuevoRangoOpen] = useState(false);
  const [nuevoRangoNombre, setNuevoRangoNombre] = useState("");
  const [nuevoRolOpen, setNuevoRolOpen] = useState(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState("");

  // ── Derived ───────────────────────────────────────────────────────────────────
  const { total: totalEfectivos, activos, inactivos } = stats;

  // ── Data loading ──────────────────────────────────────────────────────────────
  const abortRef = useRef<AbortController | null>(null);

  const fetchPersonal = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingMembers(true);
    try {
      const estadoParam =
        filterEstado === "Activo" ? true : filterEstado === "Inactivo" ? false : undefined;
      const result = await getPersonal({
        pagina: page,
        tamanio: pageSize,
        busqueda: search.trim() || undefined,
        rangoId: filterRango === "" ? undefined : filterRango,
        estado: estadoParam,
      }, controller.signal);
      setMembers(result.items);
      setTotalItems(result.total);
      setTotalPages(result.totalPaginas);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      console.error("Error fetching personal:", error);
      setMembers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMembers(false);
      }
    }
  }, [page, pageSize, search, filterEstado, filterRango]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const data = await getEstadisticasPersonal();
      setStats(data);
    } catch (error) {
      console.error("Error fetching personal stats:", error);
    }
  }, []);

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        setIsLoadingRangos(true);
        setIsLoadingRoles(true);
        const [rangosData, rolesData] = await Promise.all([getRangos(), getRoles()]);
        setRangos(rangosData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Error loading catalogos:", error);
        setRangos([]);
        setRoles([]);
      } finally {
        setIsLoadingRangos(false);
        setIsLoadingRoles(false);
      }
    };
    loadCatalogos();
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, filterRango, filterEstado, pageSize]);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  useEffect(() => {
    const handleFocus = () => {
      fetchPersonal();
      fetchEstadisticas();
    };
    const handleUsuariosActualizados = () => {
      fetchPersonal();
      fetchEstadisticas();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("usuarios-actualizados", handleUsuariosActualizados);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("usuarios-actualizados", handleUsuariosActualizados);
    };
  }, [fetchPersonal, fetchEstadisticas]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const fetchCatalogos = useCallback(async () => {
    try {
      setIsLoadingRangos(true);
      setIsLoadingRoles(true);
      const [rangosData, rolesData] = await Promise.all([getRangos(), getRoles()]);
      setRangos(rangosData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading catalogos:", error);
      setRangos([]);
      setRoles([]);
    } finally {
      setIsLoadingRangos(false);
      setIsLoadingRoles(false);
    }
  }, []);

  function openAddModal() {
    setEditingId(null);
    if (draft) {
      setForm(draft);
      toast.info("Se recuperó el borrador del miembro.");
    } else {
      setForm(emptyFormState());
    }
    setErrors({});
    setCredOpen(false);
    setShowPw(false);
    setEditingHasAccess(false);
    fetchCatalogos().then(() => setEditModalOpen(true));
  }

  async function openEditModal(m: Miembro) {
    setEditingId(m.personalId);
    setErrors({});
    setShowPw(false);
    setCredOpen(false);
    setEditingHasAccess(false);
    try {
      const full = await getPersonalById(m.personalId);
      setForm(personalResponseToForm(full));
      const hasAccess = Boolean(full.usuario);
      setEditingHasAccess(hasAccess);
      setCredOpen(hasAccess);
    } catch (error) {
      console.error("Error cargando detalle para edición:", error);
      setForm(miembroToForm(m));
      const hasAccess = Boolean(m.username || m.usuario);
      setEditingHasAccess(hasAccess);
      setCredOpen(hasAccess);
    }
    await fetchCatalogos();
    setEditModalOpen(true);
  }

  function closeModal() {
    setEditModalOpen(false);
    setEditingId(null);
    setForm(emptyFormState());
    setErrors({});
  }

  function closeDetail() {
    setDetailOpen(false);
  }

  function handleEditFromDetail() {
    if (!permisosPersonal.editar) {
      toast.warning("Solo los administradores pueden editar miembros.");
      return;
    }
    if (!selectedRecord) return;
    const record = selectedRecord;
    setDetailOpen(false);
    openEditModal(record);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "primerNombre" || field === "primerApellido") {
        next.usuario = slugify(next.primerNombre + next.primerApellido);
      }
      return next;
    });
    if (errors[field as string]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field as string];
        return n;
      });
    }
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!form.primerNombre.trim()) errs.primerNombre = "Primer nombre requerido";
    if (!form.primerApellido.trim()) errs.primerApellido = "Primer apellido requerido";
    const dpiDigits = form.dpi.replace(/\D/g, "");
    if (dpiDigits.length !== 13) errs.dpi = "DPI debe tener exactamente 13 dígitos";
    if (!form.telefono.trim()) errs.telefono = "Teléfono requerido";
    if (!form.contactoEmergencia.trim()) errs.contactoEmergencia = "Nombre del contacto requerido";
    if (!form.telEmergencia.trim()) errs.telEmergencia = "Teléfono de emergencia requerido";
    if (form.rangoId === 0) errs.rangoId = "Rango requerido";

    let passwordsMismatch = false;
    if (credOpen) {
      if (!form.usuario.trim()) errs.usuario = "Usuario requerido";
      if (!form.correo.trim()) errs.correo = "Correo requerido";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) errs.correo = "Correo inválido";
      if (!form.rolId) errs.rolId = "Rol del sistema requerido";
      const passwordRequired = !editingId || !editingHasAccess;
      if (passwordRequired && form.contrasena.length < 8) errs.contrasena = "Mínimo 8 caracteres";
      const confirmRequired = passwordRequired || form.contrasena.length > 0;
      if (confirmRequired && form.confirmarContrasena !== form.contrasena) {
        errs.confirmarContrasena = "Las contraseñas no coinciden";
        passwordsMismatch = true;
      }
    }

    setErrors(errs);

    if (passwordsMismatch) {
      toast.error("Las contraseñas no coinciden. Verifícalas e inténtalo de nuevo.");
      return;
    }

    if (Object.keys(errs).length > 0) {
      toast.warning("Por favor completa los campos obligatorios (*).");
      return;
    }

    const isDuplicate = members.some(
      (m) => m.dpi.replace(/\D/g, "") === dpiDigits && m.personalId !== editingId
    );
    if (dpiDigits.length !== 13 || isDuplicate) {
      toast.error("El DPI ya se encuentra registrado.");
      return;
    }

    const payload: CrearPersonalDto | ActualizarPersonalDto = {
      primerNombre: form.primerNombre,
      segundoNombre: form.segundoNombre,
      primerApellido: form.primerApellido,
      segundoApellido: form.segundoApellido,
      dpi: form.dpi,
      fechaNacimiento: form.fechaNacimiento || null,
      rangoId: form.rangoId,
      fechaIngreso: form.fechaIngreso || new Date().toISOString().split("T")[0],
      telefono: form.telefono,
      estado: form.estado === "Activo",
      contactoEmergenciaNombre: form.contactoEmergencia,
      contactoEmergenciaTelefono: form.telEmergencia,
    };

    if (credOpen && form.usuario && form.rolId) {
      payload.accesoSistema = {
        username: form.usuario,
        password: form.contrasena,
        email: form.correo,
        rolId: form.rolId,
      };
    }

    setSaving(true);
    try {
      if (editingId !== null) {
        await actualizarPersonal(editingId, payload as ActualizarPersonalDto);
        toast.success("Datos actualizados exitosamente.");
      } else {
        await registrarPersonal(payload as CrearPersonalDto);
        toast.success("Miembro registrado correctamente.");
        clear();
      }
      setForm(emptyFormState());
      closeModal();
      await Promise.all([fetchPersonal(), fetchEstadisticas()]);
      window.dispatchEvent(new CustomEvent("usuarios-actualizados"));
    } catch (error) {
      console.error("Error registrando personal:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      const isDuplicateError =
        msg.includes("duplicate") || msg.includes("duplicado") || msg.includes("DPI") ||
        msg.includes("username") || msg.includes("usuario") || msg.includes("correo") ||
        msg.includes("email") || msg.includes("registrado");
      toast.error(isDuplicateError ? "El DPI, nombre de usuario o correo ya se encuentra registrado." : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await eliminarPersonal(deleteId);
      setDeleteId(null);
      await Promise.all([fetchPersonal(), fetchEstadisticas()]);
      toast.success("Miembro desactivado correctamente.");
    } catch (error) {
      console.error("Error eliminando personal:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(msg);
    }
  }

  async function handleCrearRango() {
    const nombre = nuevoRangoNombre.trim();
    if (!nombre) {
      toast.warning("Por favor ingresa el nombre del rango.");
      return;
    }
    const existe = rangos.some((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      toast.warning("El rango ya existe en la lista.");
      return;
    }
    try {
      const nuevo = await crearRango(nombre);
      setRangos((prev) => [...prev, nuevo]);
      setField("rangoId", nuevo.id);
      setNuevoRangoNombre("");
      setNuevoRangoOpen(false);
      toast.success("Rango agregado correctamente.");
    } catch (error) {
      console.error("Error creando rango:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(msg);
    }
  }

  async function handleCrearRol() {
    const nombre = nuevoRolNombre.trim();
    if (!nombre) {
      toast.warning("Por favor ingresa el nombre del rol.");
      return;
    }
    const existe = roles.some((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      toast.warning("El rol ya existe en la lista.");
      return;
    }
    try {
      const nuevo = await crearRol(nombre);
      setRoles((prev) => [...prev, nuevo]);
      setField("rolId", nuevo.id);
      setNuevoRolNombre("");
      setNuevoRolOpen(false);
      toast.success("Rol agregado correctamente.");
    } catch (error) {
      console.error("Error creando rol:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(msg);
    }
  }

  const detailTabs: TabItem[] = selectedRecord
    ? [
        {
          id: "info",
          label: "Info",
          icon: <Info size={15} />,
          content: <MemberInfo member={selectedRecord} />,
        },
        {
          id: "historial",
          label: "Historial",
          icon: <History size={15} />,
          content: (
            <EmptyState
              icon={History}
              title="Sin historial"
              description="El historial de servicio de este miembro aparecerá aquí."
            />
          ),
        },
        {
          id: "documentos",
          label: "Documentos",
          icon: <FileText size={15} />,
          content: (
            <EmptyState
              icon={FileText}
              title="Sin documentos"
              description="Los documentos del miembro aparecerán aquí."
            />
          ),
        },
      ]
    : [];

  const personalColumns: DataTableColumn<Miembro>[] = useMemo(
    () => [
      {
        key: "codigoBombero",
        header: "Código",
        cell: (m) => (
          <span className="font-mono font-semibold" style={{ color: "var(--brand-600)" }}>
            {m.codigoBombero || "Sin código"}
          </span>
        ),
      },
      {
        key: "nombreCompleto",
        header: "Nombre Completo",
        cell: (m) => (
          <span className="font-medium" style={{ color: "var(--text-1)" }}>
            {m.nombreCompleto}
          </span>
        ),
      },
      {
        key: "dpi",
        header: "DPI",
        cell: (m) => (
          <span className="font-mono" style={{ color: "var(--text-2)" }}>
            {m.dpi}
          </span>
        ),
      },
      {
        key: "rangoNombre",
        header: "Rango",
        cell: (m) => (
          <Badge variant="info" size="sm">
            {m.rangoNombre || "Sin rango"}
          </Badge>
        ),
      },
      {
        key: "estado",
        header: "Estado",
        cell: (m) => (
          <Badge variant={m.estado ? "success" : "default"} size="sm" dot>
            {m.estado ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        key: "telefono",
        header: "Teléfono",
        cell: (m) => (
          <span style={{ color: "var(--text-2)" }}>{m.telefono || "—"}</span>
        ),
      },
      {
        key: "fechaIngreso",
        header: "Fecha de Ingreso",
        cell: (m) => (
          <span style={{ color: "var(--text-2)" }}>{formatDate(m.fechaIngreso)}</span>
        ),
      },
    ],
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>
            Personal — 33ª Compañía
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
            Bomberos Voluntarios San Lucas Tolimán
          </p>
        </div>
        {permisosPersonal.crear && (
          <Button variant="brand" onClick={openAddModal}>
            <Plus className="size-4" />
            Nuevo Miembro
          </Button>
        )}
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)", transition: "transform 0.15s ease, box-shadow 0.15s ease", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "var(--elevation-brand-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
          onClick={() => setFilterEstado("")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--brand-50)" }}>
            <Users size={20} style={{ color: BRAND }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Total Efectivos</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{totalEfectivos}</p>
          </div>
        </div>

        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)", transition: "transform 0.15s ease, box-shadow 0.15s ease", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "var(--elevation-brand-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
          onClick={() => setFilterEstado("Activo")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--success-50)" }}>
            <UserCheck size={20} style={{ color: "var(--success-600)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Activos</p>
            <p className="text-2xl font-bold" style={{ color: "var(--success-600)" }}>{activos}</p>
          </div>
        </div>

        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)", transition: "transform 0.15s ease, box-shadow 0.15s ease", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "var(--elevation-brand-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
          onClick={() => setFilterEstado("Inactivo")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--brand-50)" }}>
            <UserX size={20} style={{ color: BRAND }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Inactivos</p>
            <p className="text-2xl font-bold" style={{ color: BRAND }}>{inactivos}</p>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <DataTable<Miembro>
        columns={personalColumns}
        data={members}
        getRowKey={(m) => m.personalId}
        loading={isLoadingMembers}
        pageSize={pageSize}
        pageSizeOptions={[8, 16, 32]}
        serverPagination={{ page, pageSize, totalItems, totalPages }}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyIcon={Users}
        emptyTitle="No se encontraron miembros"
        emptyDescription="No hay registros que coincidan con los filtros de búsqueda seleccionados."
        onRowClick={(m) => {
          detailFetchRef.current = m.personalId;
          setSelectedRecord(m);
          setDetailOpen(true);
          getPersonalById(m.personalId)
            .then((full) => {
              if (detailFetchRef.current === m.personalId) {
                setSelectedRecord(personalResponseToMiembro(full));
              }
            })
            .catch((error) => console.error("Error refrescando detalle:", error));
        }}
        toolbar={
          <>
            <div className="min-w-[240px] flex-1">
              <Input
                startIcon={<Search size={15} />}
                placeholder="Buscar por nombre, código, DPI o teléfono..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select
              value={filterRango}
              onChange={(e) => setFilterRango(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-1)",
                border: "1px solid var(--border)",
              }}
            >
              <option value="">Todos los rangos</option>
              {rangos.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setEstadoDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: filterEstado === "Activo" ? "var(--success-600)" : filterEstado === "Inactivo" ? BRAND : "var(--neutral-400)",
                  }}
                />
                {filterEstado === "Activo" ? "Activos" : filterEstado === "Inactivo" ? "Inactivos" : "Todos"}
                <ChevronDown size={14} style={{ color: "var(--text-3)", transform: estadoDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>
              {estadoDropdownOpen && (
                <div
                  style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 30, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow)", minWidth: 140, overflow: "hidden" }}
                >
                  {([["Activo", "Activos", "var(--success-600)"], ["Inactivo", "Inactivos", BRAND], ["", "Todos", "var(--neutral-400)"]] as const).map(([val, label, color]) => (
                    <button
                      key={label}
                      onClick={() => { setFilterEstado(val); setEstadoDropdownOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", fontSize: 13, color: "var(--text-1)", background: filterEstado === val ? "var(--bg-hover)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        }
      />

      {/* ── Add / Edit Modal ───────────────────────────────────────────────────── */}
      <PersonalForm
        open={editModalOpen}
        onClose={closeModal}
        editingId={editingId}
        form={form}
        setForm={setForm}
        errors={errors}
        setErrors={setErrors}
        credOpen={credOpen}
        setCredOpen={setCredOpen}
        showPw={showPw}
        setShowPw={setShowPw}
        hasAccess={editingHasAccess}
        rangos={rangos}
        roles={roles}
        saving={saving}
        onSubmit={handleSubmit}
        draftSavedAt={savedAt}
        draftOnline={online}
        draft={draft}
        onDraftDiscard={clear}
      />

      {/* ── Detail Drawer ───────────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={closeDetail}
        side="right"
        size="lg"
        title={selectedRecord?.nombreCompleto}
        icon={<Users className="size-6" />}
        statusBadge={
          selectedRecord ? (
            <Badge variant={selectedRecord.estado ? "success" : "default"} dot>
              {selectedRecord.estado ? "Activo" : "Inactivo"}
            </Badge>
          ) : undefined
        }
        footer={
          <>
            {permisosPersonal.editar && (
              <Button variant="brand-outline" onClick={() => window.print()}>
                <Printer className="size-4" />
                Imprimir
              </Button>
            )}
            {permisosPersonal.editar && (
              <Button variant="brand" onClick={handleEditFromDetail}>
                <Pencil className="size-4" />
                Editar
              </Button>
            )}
          </>
        }
      >
        {selectedRecord && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>

      {/* ── Delete Confirmation ────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: BRAND }}>
              <h3 className="font-semibold text-white">Desactivar Miembro</h3>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--brand-100)" }}>
                  <AlertTriangle size={20} style={{ color: BRAND }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-1)" }}>Desactivar Miembro</h3>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>
                ¿Estás seguro de que deseas desactivar a{" "}
                <strong style={{ color: "var(--text-1)" }}>
                  {members.find((m) => m.personalId === deleteId)?.nombreCompleto}
                </strong>{" "}
                del registro?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="brand-outline" onClick={() => setDeleteId(null)}>
                  Cancelar
                </Button>
                <Button variant="brand" onClick={handleDelete}>
                  Sí, desactivar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
