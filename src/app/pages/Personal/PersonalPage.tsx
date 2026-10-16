import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Users, UserCheck, UserX, ChevronDown, Printer, Pencil, History, FileText, Info, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PersonalTable } from "@/app/pages/Personal/components/PersonalTable";
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
  registrarPersonal,
  actualizarPersonal,
  eliminarPersonal,
  type CrearPersonalDto,
  type ActualizarPersonalDto,
} from "../../../services/personalService";
import type { Estado, Miembro, FormState, RangoItem, RolItem } from "@/types/personal";
import { formatDate } from "@/utils/format";
import { emptyFormState, miembroToForm } from "@/utils/formHelpers";
import { useAlert } from "@/app/components/ui/AlertContext";

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
    { label: "Usuario del Sistema", value: member.usuario?.username || "Sin cuenta" },
    { label: "Rol del Sistema", value: member.usuario?.rol || member.rolNombre || "Sin rol" },
    { label: "Acceso al Sistema", value: member.usuario ? "Sí" : "No" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
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
  const { role } = useAuth();

  const [members, setMembers] = useState<Miembro[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);
  const [filterRango, setFilterRango] = useState<RangoItem["nombre"] | "">("");
  const [filterEstado, setFilterEstado] = useState<Estado | "">("Activo");
  const [page, setPage] = useState(1);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [credOpen, setCredOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Miembro | null>(null);

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
  const filtered = useMemo(() => {
    if (!Array.isArray(members)) return [];
    return members.filter((m) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, "");

      const matchNombre =
        m.nombreCompleto.toLowerCase().includes(q) ||
        m.nombreCompleto.toLowerCase().split(" ").some((p) => p.startsWith(q));

      const matchCodigo =
        m.codigo.toLowerCase().includes(q) || (m.codigoBombero && m.codigoBombero.toLowerCase().includes(q));

      const matchDpi = qDigits.length >= 2 && m.dpi.replace(/\D/g, "").includes(qDigits);

      const matchTelefono = qDigits.length >= 2 && (m.telefono || "").replace(/\D/g, "").includes(qDigits);

      const matchUsuario = m.usuario?.username?.toLowerCase().includes(q) || false;

      const matchSearch = matchNombre || matchCodigo || matchDpi || matchTelefono || matchUsuario;

      const matchRango = !filterRango || m.rangoNombre === filterRango;
      const matchEstado = !filterEstado || m.estado === filterEstado;

      return matchSearch && matchRango && matchEstado;
    });
  }, [members, search, filterRango, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const totalEfectivos = members.length;
  const activos = members.filter((m) => m.estado === true).length;
  const inactivos = members.filter((m) => m.estado === false).length;

  // ── Data loading ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingRangos(true);
        setIsLoadingRoles(true);
        const [rangosData, rolesData, personalData] = await Promise.all([
          getRangos(),
          getRoles(),
          getPersonal(),
        ]);
        setRangos(rangosData);
        setRoles(rolesData);
        setMembers(personalData);
      } catch (error) {
        console.error("Error loading data:", error);
        setMembers([]);
        setRangos([]);
        setRoles([]);
      } finally {
        setIsLoadingRangos(false);
        setIsLoadingRoles(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const fetchPersonal = useCallback(async () => {
    try {
      const data = await getPersonal();
      if (!Array.isArray(data)) {
        setMembers([]);
        return;
      }
      setMembers(data);
    } catch (error) {
      console.error("Error fetching personal:", error);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchPersonal();
    };
    const handleUsuariosActualizados = () => {
      fetchPersonal();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("usuarios-actualizados", handleUsuariosActualizados);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("usuarios-actualizados", handleUsuariosActualizados);
    };
  }, [fetchPersonal]);

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
    setForm(emptyFormState());
    setErrors({});
    fetchCatalogos().then(() => setEditModalOpen(true));
  }

  function openEditModal(m: Miembro) {
    setEditingId(m.personalId);
    setForm(miembroToForm(m));
    setErrors({});
    fetchCatalogos().then(() => setEditModalOpen(true));
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

    if (credOpen) {
      if (!form.usuario.trim()) errs.usuario = "Usuario requerido";
      if (!form.rolId) errs.rolId = "Rol del sistema requerido";
      if (!editingId && form.contrasena.length < 8) errs.contrasena = "Mínimo 8 caracteres";
      if (form.confirmarContrasena !== form.contrasena) errs.confirmarContrasena = "Las contraseñas no coinciden";
    }

    setErrors(errs);

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
      }
      setForm(emptyFormState());
      closeModal();
      await fetchPersonal();
    } catch (error) {
      console.error("Error registrando personal:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      const isDuplicateError =
        msg.includes("duplicate") || msg.includes("duplicado") || msg.includes("DPI") ||
        msg.includes("username") || msg.includes("usuario");
      toast.error(isDuplicateError ? "El DPI o nombre de usuario ya se encuentra registrado." : msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await eliminarPersonal(deleteId);
      setMembers((prev) =>
        prev.map((m) => (m.personalId === deleteId ? { ...m, estado: false } : m))
      );
      setDeleteId(null);
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>
            Personal — 33ª Compañía
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
            Bomberos Voluntarios San Lucas Tolimán
          </p>
        </div>
        <Button variant="brand" onClick={openAddModal}>
          <Plus className="size-4" />
          Nuevo Miembro
        </Button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)", transition: "transform 0.15s ease, box-shadow 0.15s ease", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "var(--elevation-brand-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
          onClick={() => { setFilterEstado(""); setPage(1); }}
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
          onClick={() => { setFilterEstado("Activo"); setPage(1); }}
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
          onClick={() => { setFilterEstado("Inactivo"); setPage(1); }}
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

      {/* ── Search & Filters Bar ──────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            startIcon={<Search size={15} />}
            placeholder="Buscar por nombre, código o DPI..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>

        <select
          value={filterRango}
          onChange={(e) => { setFilterRango(e.target.value as RangoItem["nombre"] | ""); setPage(1); }}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--bg-input)",
            color: "var(--text-1)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="">Todos los rangos</option>
          {rangos.map((r) => (
            <option key={r.id} value={r.nombre}>{r.nombre}</option>
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
                  onClick={() => { setFilterEstado(val); setPage(1); setEstadoDropdownOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", fontSize: 13, color: "var(--text-1)", background: filterEstado === val ? "var(--bg-hover)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <PersonalTable
        members={members}
        search={search}
        setSearch={setSearch}
        filterRango={filterRango}
        setFilterRango={setFilterRango}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        PAGE_SIZE={PAGE_SIZE}
        rangos={rangos}
        roles={roles}
        onRowClick={(m) => {
          setSelectedRecord(m);
          setDetailOpen(true);
        }}
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
        rangos={rangos}
        roles={roles}
        saving={saving}
        onSubmit={handleSubmit}
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
            <Button variant="brand-outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Imprimir
            </Button>
            <Button variant="brand" onClick={handleEditFromDetail}>
              <Pencil className="size-4" />
              Editar
            </Button>
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
