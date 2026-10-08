import { useState, useEffect } from "react";
import {
  X, Lock, Phone, User, MapPin, ChevronDown, Truck, Heart, Loader2, Package,
} from "lucide-react";
import { toast } from "sonner";
import { useEmergencias } from "@/hooks/useEmergencias";
import { inventarioService } from "@/services/inventarioService";
import { AlertDialog } from "@/app/components/AlertDialog";
import type { PersonalAsignado } from "@/types/emergencia";
import type { InventarioItem } from "@/types/inventario";

interface Props {
  onClose: () => void;
  currentUser?: string;
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-3)",
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const inputBase: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-1)",
  fontSize: 14,
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: "none",
  cursor: "pointer",
};

const OpcionesGenero = ["Masculino", "Femenino"];
const OpcionesEstadoEntrega = ["Estable", "Delicado", "Grave", "Fallecido en traslado"];

function getNow() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

interface PersonalSel {
  personalId: string | null;
  nombre: string;
  rolServicioId: number | null;
}

export function RegisterServicePage({ onClose, currentUser = "" }: Props) {
  const { catalogos, cargarCatalogos, getSiguienteIncidente, crearEmergencia } = useEmergencias();

  const [numeroIncidente, setNumeroIncidente] = useState("");
  const [tipoSolicitud, setTipoSolicitud] = useState<"Telefónica" | "Personal">("Telefónica");
  const [tiempoSalida, setTiempoSalida] = useState("");
  const [tiempoLlegada, setTiempoLlegada] = useState("");
  const [tipoEmergenciaId, setTipoEmergenciaId] = useState("");
  const [tiposAsistencia, setTiposAsistencia] = useState<string[]>([]);
  const [nuevoTipoAsistencia, setNuevoTipoAsistencia] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [hospitalDestinoId, setHospitalDestinoId] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [acompanante, setAcompanante] = useState("");
  const [fallecido, setFallecido] = useState(false);
  const [domicilio, setDomicilio] = useState("");
  const [presionArterial, setPresionArterial] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [horaToma, setHoraToma] = useState(() => getNow());
  const [estadoEntrega, setEstadoEntrega] = useState("");
  const [unidadAsignadaId, setUnidadAsignadaId] = useState("");
  const [personalSeleccionado, setPersonalSeleccionado] = useState<PersonalSel[]>([]);
  const [resumen, setResumen] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [insumos, setInsumos] = useState<{ itemId: number; cantidad: number }[]>([]);
  const [itemsDisponibles, setItemsDisponibles] = useState<InventarioItem[]>([]);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "error" | "warning";
    title: string;
    message: string;
    details: string[];
  }>({ open: false, type: "error", title: "", message: "", details: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      await cargarCatalogos();
      const correlativo = await getSiguienteIncidente();
      if (mounted && correlativo) setNumeroIncidente(correlativo);
    })();
    return () => {
      mounted = false;
    };
  }, [cargarCatalogos, getSiguienteIncidente]);

  useEffect(() => {
    let mounted = true;
    inventarioService.getItems({ pagina: 1, tamanio: 200 }).then((r) => {
      if (mounted) setItemsDisponibles(r.items);
    }).catch(() => {
      if (mounted) setItemsDisponibles([]);
    });
    return () => {
      mounted = false;
    };
  }, []);

  function toggleTipoAsistencia(tipo: string) {
    setTiposAsistencia((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
    setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
  }

  function togglePersonal(personalId: string, nombre: string) {
    setPersonalSeleccionado((prev) => {
      const existe = prev.find((p) => p.personalId === personalId);
      if (existe) return prev.filter((p) => p.personalId !== personalId);
      const rolDefault = catalogos.rolesServicio[0]?.id ?? null;
      return [...prev, { personalId, nombre, rolServicioId: rolDefault }];
    });
    setErrors((prev) => ({ ...prev, personalAsignado: false }));
  }

  function setRolPersonal(personalId: string, rolServicioId: number | null) {
    setPersonalSeleccionado((prev) =>
      prev.map((p) => (p.personalId === personalId ? { ...p, rolServicioId } : p))
    );
  }

  async function handleSubmit() {
    const newErrors: Record<string, boolean> = {};
    if (!tipoEmergenciaId) newErrors.tipoEmergenciaId = true;
    if (tiposAsistencia.length === 0) newErrors.tiposAsistencia = true;
    if (!ubicacion.trim()) newErrors.ubicacion = true;
    if (!nombrePaciente.trim()) newErrors.nombrePaciente = true;
    if (!hospitalDestinoId) newErrors.hospitalDestinoId = true;
    if (!unidadAsignadaId) newErrors.unidadAsignadaId = true;
    if (personalSeleccionado.length === 0) newErrors.personalAsignado = true;

    const edadNum = Number(edad);
    if (edad && (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 120)) newErrors.edad = true;

    const fc = Number(frecuenciaCardiaca);
    if (frecuenciaCardiaca && (Number.isNaN(fc) || fc < 30 || fc > 250)) newErrors.frecuenciaCardiaca = true;

    const sat = Number(saturacion);
    if (saturacion && (Number.isNaN(sat) || sat < 0 || sat > 100)) newErrors.saturacion = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setAlertState({
        open: true,
        type: "warning",
        title: "Campos Incompletos",
        message: "Complete los datos obligatorios (*) antes de continuar.",
        details: [],
      });
      return;
    }

    setSubmitting(true);
    try {
      const personalAsignado: PersonalAsignado[] = personalSeleccionado.map((p) => ({
        personalId: p.personalId ?? null,
        nombrePersonal: p.nombre,
        rolServicioId: p.rolServicioId,
      }));

      const dto = {
        numeroIncidente,
        fecha,
        horaSalida: tiempoSalida || undefined,
        horaEntrada: tiempoLlegada || undefined,
        solicitudTipo: tipoSolicitud,
        tipoEmergenciaId: Number(tipoEmergenciaId),
        tiposAsistencia,
        ubicacion: ubicacion.trim(),
        hospitalDestinoId: Number(hospitalDestinoId),
        paciente: nombrePaciente.trim(),
        edad: edadNum || undefined,
        genero: genero || undefined,
        solicitante: solicitante || undefined,
        acompanante: acompanante || undefined,
        fallecio: fallecido,
        domicilio: domicilio || undefined,
        estadoEntrega: estadoEntrega || undefined,
        unidadAsignadaId: Number(unidadAsignadaId),
        personalAsignado,
        signosVitales: {
          presionArterial: presionArterial || undefined,
          frecuenciaCardiaca: fc || undefined,
          frecuenciaRespiratoria: Number(frecuenciaRespiratoria) || undefined,
          saturacionOxigeno: sat || undefined,
          horaToma,
        },
        resumen: resumen || undefined,
        creadoPorNombre: currentUser || undefined,
        insumosUtilizados: insumos
          .filter((i) => i.itemId > 0 && i.cantidad > 0)
          .map((i) => ({ itemId: i.itemId, cantidad: i.cantidad })),
      };

      const resultado = await crearEmergencia(dto);

      if (resultado && resultado.exito) {
        toast.success("Emergencia registrada", {
          description: `Incidente ${resultado.numeroIncidente}`,
        });
        onClose();
      } else {
        setAlertState({
          open: true,
          type: "error",
          title: "Error al Registrar",
          message: "No se pudo registrar la emergencia. Intente nuevamente.",
          details: [],
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      setAlertState({
        open: true,
        type: "error",
        title: "Error de Servidor",
        message: "No se pudo conectar con el servidor.",
        details: [mensaje],
      });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedIds = new Set(personalSeleccionado.map((p) => p.personalId));

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
          background: "var(--bg-card)",
          borderRadius: 24,
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            background: "var(--bg-input)",
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 24, borderRadius: 2, background: "var(--red)" }} />
            <h1
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-1)",
                margin: 0,
              }}
            >
              Registrar Emergencia
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Cerrar"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            overflowY: "auto",
            padding: "24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* 1. Código de Emergencia */}
          <section>
            <p style={sectionLabel}>Código de Emergencia</p>
            <div style={{ position: "relative" }}>
              <Lock
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 15,
                  height: 15,
                  color: "var(--text-3)",
                  pointerEvents: "none",
                }}
              />
              <input
                readOnly
                value={numeroIncidente}
                style={{ ...inputBase, paddingLeft: 32, color: "var(--text-3)", cursor: "default" }}
              />
            </div>
          </section>

          {/* 2. Tipo de Solicitud */}
          <section>
            <p style={sectionLabel}>Tipo de Solicitud</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Telefónica", "Personal"] as const).map((tipo) => {
                const active = tipoSolicitud === tipo;
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoSolicitud(tipo)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: active ? "none" : "1px solid var(--border)",
                      background: active ? "var(--red)" : "var(--bg-input)",
                      color: active ? "#fff" : "var(--text-2)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    {tipo === "Telefónica" ? (
                      <Phone style={{ width: 14, height: 14 }} />
                    ) : (
                      <User style={{ width: 14, height: 14 }} />
                    )}
                    {tipo}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Tipo de Emergencia */}
          <section>
            <p style={sectionLabel}>
              Tipo de Emergencia
              {errors.tipoEmergenciaId && (
                <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
              )}
            </p>
            <div style={{ position: "relative" }}>
              <select
                value={tipoEmergenciaId}
                onChange={(e) => {
                  setTipoEmergenciaId(e.target.value);
                  setErrors((prev) => ({ ...prev, tipoEmergenciaId: false }));
                }}
                style={{
                  ...selectBase,
                  paddingRight: 32,
                  boxShadow: errors.tipoEmergenciaId ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                }}
              >
                <option value="">Seleccionar tipo de emergencia…</option>
                {catalogos.tiposEmergencia.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 15,
                  height: 15,
                  color: "var(--text-3)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </section>

          {/* 4. Tiempos de Atención */}
          <section>
            <p style={sectionLabel}>Tiempos de Atención</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Salida", value: tiempoSalida, set: setTiempoSalida },
                { label: "Llegada", value: tiempoLlegada, set: setTiempoLlegada },
              ].map((campo) => (
                <div key={campo.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{campo.label}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="time"
                      value={campo.value}
                      onChange={(e) => campo.set(e.target.value)}
                      style={{ ...inputBase, flex: 1, padding: "8px 10px" }}
                    />
                    <button
                      onClick={() => campo.set(getNow())}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--red)",
                        background: "transparent",
                        color: "var(--red)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}
                    >
                      Ahora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Tipos de Asistencia — Input libre con sugerencias */}
          <section>
            <p style={sectionLabel}>
              Tipos de Asistencia
              {errors.tiposAsistencia && (
                <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
              )}
            </p>

            {/* Tags seleccionados */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {tiposAsistencia.map((tipo, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "var(--red)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {tipo}
                  <button
                    onClick={() => setTiposAsistencia(tiposAsistencia.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Input con autocomplete automático */}
            <input
              list="tiposAsistenciaList"
              value={nuevoTipoAsistencia}
              onChange={(e) => {
                const valor = e.target.value;
                setNuevoTipoAsistencia(valor);
                const coincidencia = catalogos.tiposAsistencia.find(
                  (t) => t.nombre.toLowerCase() === valor.toLowerCase()
                );
                if (coincidencia && !tiposAsistencia.includes(coincidencia.nombre)) {
                  setTiposAsistencia([...tiposAsistencia, coincidencia.nombre]);
                  setNuevoTipoAsistencia("");
                  setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nuevoTipoAsistencia.trim()) {
                  e.preventDefault();
                  const valor = nuevoTipoAsistencia.trim();
                  if (!tiposAsistencia.includes(valor)) {
                    setTiposAsistencia([...tiposAsistencia, valor]);
                  }
                  setNuevoTipoAsistencia("");
                  setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
                }
              }}
              placeholder="Escriba o seleccione..."
              style={{ ...inputBase, boxShadow: errors.tiposAsistencia ? "0 0 0 3px var(--red, #c11d1d)40" : "none" }}
            />
            <datalist id="tiposAsistenciaList">
              {catalogos.tiposAsistencia
                .filter((t) => !tiposAsistencia.includes(t.nombre))
                .map((t) => (
                  <option key={t.id} value={t.nombre} />
                ))}
            </datalist>
          </section>

          {/* 6. Ubicación */}
          <section>
            <p style={sectionLabel}>
              Ubicación del Incidente
              {errors.ubicacion && (
                <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
              )}
            </p>
            <div style={{ position: "relative" }}>
              <MapPin
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 15,
                  height: 15,
                  color: "var(--text-3)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => {
                  setUbicacion(e.target.value);
                  setErrors((prev) => ({ ...prev, ubicacion: false }));
                }}
                placeholder="Aldea, sector o punto de referencia"
                style={{
                  ...inputBase,
                  paddingLeft: 32,
                  boxShadow: errors.ubicacion ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                }}
              />
            </div>
          </section>

          {/* 7. Hospital de Destino */}
          <section>
            <p style={sectionLabel}>
              Hospital de Destino
              {errors.hospitalDestinoId && (
                <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
              )}
            </p>
            <div style={{ position: "relative" }}>
              <select
                value={hospitalDestinoId}
                onChange={(e) => {
                  setHospitalDestinoId(e.target.value);
                  setErrors((prev) => ({ ...prev, hospitalDestinoId: false }));
                }}
                style={{
                  ...selectBase,
                  paddingRight: 32,
                  boxShadow: errors.hospitalDestinoId ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                }}
              >
                <option value="">Seleccionar hospital…</option>
                {catalogos.hospitales.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 15,
                  height: 15,
                  color: "var(--text-3)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </section>

          {/* 8. Datos del Paciente */}
          <section>
            <p style={sectionLabel}>Datos del Paciente</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Nombre Completo{" "}
                  {errors.nombrePaciente && <span style={{ color: "var(--red)" }}>*</span>}
                </label>
                <input
                  type="text"
                  value={nombrePaciente}
                  onChange={(e) => {
                    setNombrePaciente(e.target.value);
                    setErrors((prev) => ({ ...prev, nombrePaciente: false }));
                  }}
                  placeholder="Nombre del paciente"
                  style={{
                    ...inputBase,
                    boxShadow: errors.nombrePaciente ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                    Edad
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={edad}
                    onChange={(e) => {
                      setEdad(e.target.value);
                      setErrors((prev) => ({ ...prev, edad: false }));
                    }}
                    placeholder="—"
                    min={0}
                    max={120}
                    style={{
                      ...inputBase,
                      width: 80,
                      boxShadow: errors.edad ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                    Género
                  </label>
                  <select value={genero} onChange={(e) => setGenero(e.target.value)} style={{ ...selectBase, paddingRight: 32 }}>
                    <option value="" disabled>
                      Seleccione una opción
                    </option>
                    {OpcionesGenero.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Solicitante
                </label>
                <input type="text" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nombre del solicitante" style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Acompañante
                </label>
                <input type="text" value={acompanante} onChange={(e) => setAcompanante(e.target.value)} placeholder="Nombre del acompañante" style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Domicilio
                </label>
                <input type="text" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} placeholder="Domicilio del paciente" style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Fallecido
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setFallecido(false)}
                    style={{
                      padding: "6px 18px",
                      borderRadius: 999,
                      border: !fallecido ? "none" : "1px solid var(--border)",
                      background: !fallecido ? "#16a34a" : "var(--bg-input)",
                      color: !fallecido ? "#fff" : "var(--text-2)",
                      fontSize: 13,
                      fontWeight: !fallecido ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setFallecido(true)}
                    style={{
                      padding: "6px 18px",
                      borderRadius: 999,
                      border: fallecido ? "none" : "1px solid var(--border)",
                      background: fallecido ? "var(--red)" : "var(--bg-input)",
                      color: fallecido ? "#fff" : "var(--text-2)",
                      fontSize: 13,
                      fontWeight: fallecido ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    Sí
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 9. Evaluación / Signos Vitales */}
          <section>
            <p style={sectionLabel}>
              <Heart style={{ width: 13, height: 13, color: "var(--red)" }} />
              Evaluación del Paciente / Signos Vitales
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Presión Arterial (mmHg)
                </label>
                <input type="text" value={presionArterial} onChange={(e) => setPresionArterial(e.target.value)} placeholder="120/80" style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Frecuencia Cardíaca (BPM)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={frecuenciaCardiaca}
                  onChange={(e) => {
                    setFrecuenciaCardiaca(e.target.value);
                    setErrors((prev) => ({ ...prev, frecuenciaCardiaca: false }));
                  }}
                  placeholder="72"
                  style={{
                    ...inputBase,
                    boxShadow: errors.frecuenciaCardiaca ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Frecuencia Respiratoria (resp/min)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={frecuenciaRespiratoria}
                  onChange={(e) => setFrecuenciaRespiratoria(e.target.value)}
                  placeholder="16"
                  style={inputBase}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Saturación de Oxígeno (%SpO₂)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={saturacion}
                  onChange={(e) => {
                    setSaturacion(e.target.value);
                    setErrors((prev) => ({ ...prev, saturacion: false }));
                  }}
                  placeholder="98"
                  style={{
                    ...inputBase,
                    boxShadow: errors.saturacion ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Hora de Toma
                </label>
                <input type="time" value={horaToma} onChange={(e) => setHoraToma(e.target.value)} style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Estado al Entregar en Hospital
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={estadoEntrega}
                    onChange={(e) => setEstadoEntrega(e.target.value)}
                    style={{ ...selectBase, paddingRight: 32 }}
                  >
                    <option value="">Seleccionar estado…</option>
                    {OpcionesEstadoEntrega.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 14,
                      height: 14,
                      color: "var(--text-3)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 10. Recursos Asignados */}
          <section>
            <p style={sectionLabel}>
              <Truck style={{ width: 13, height: 13 }} />
              Recursos Asignados
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Unidad / Vehículo
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={unidadAsignadaId}
                  onChange={(e) => {
                    setUnidadAsignadaId(e.target.value);
                    setErrors((prev) => ({ ...prev, unidadAsignadaId: false }));
                  }}
                  style={{
                    ...selectBase,
                    paddingRight: 32,
                    boxShadow: errors.unidadAsignadaId ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                  }}
                >
                  <option value="">Seleccionar unidad…</option>
                  {catalogos.unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 14,
                    height: 14,
                    color: "var(--text-3)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Personal
                {errors.personalAsignado && <span style={{ color: "var(--red)", marginLeft: 4 }}>*</span>}
              </label>
              {catalogos.personal.length === 0 ? (
                <p style={{ color: "var(--text-2)", fontSize: 12, margin: "8px 0" }}>Sin personal disponible</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {catalogos.personal.map((p) => {
                    const selected = selectedIds.has(p.personalId);
                    return (
                      <div
                        key={p.personalId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: selected ? "1px solid var(--red)" : "1px solid var(--border)",
                          background: selected ? "#fef2f2" : "var(--bg-input)",
                          boxShadow: errors.personalAsignado && !selected ? "0 0 0 3px var(--red, #c11d1d)40" : "none",
                        }}
                      >
                        <button
                          onClick={() => togglePersonal(p.personalId, p.nombreCompleto)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            padding: 0,
                            color: "var(--text-1)",
                            fontSize: 13,
                            fontWeight: 500,
                            fontFamily: "inherit",
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: "1px solid var(--border)",
                              background: selected ? "var(--red)" : "transparent",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 11,
                              flexShrink: 0,
                            }}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          {p.nombreCompleto}
                        </button>
                        {selected && (
                          <select
                            value={personalSeleccionado.find((s) => s.personalId === p.personalId)?.rolServicioId ?? ""}
                            onChange={(e) => setRolPersonal(p.personalId, e.target.value ? Number(e.target.value) : null)}
                            style={{ ...selectBase, width: 160, padding: "4px 8px", fontSize: 12 }}
                          >
                            <option value="">Rol…</option>
                            {catalogos.rolesServicio.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 11. Insumos Utilizados */}
          <section>
            <p style={sectionLabel}>
              <Package style={{ width: 13, height: 13 }} />
              Insumos Utilizados (opcional)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insumos.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={ins.itemId}
                    onChange={(e) =>
                      setInsumos(insumos.map((x, j) => (j === i ? { ...x, itemId: Number(e.target.value) } : x)))
                    }
                    style={{ ...selectBase, flex: 1 }}
                  >
                    <option value={0}>Seleccionar insumo...</option>
                    {itemsDisponibles.map((it) => (
                      <option key={it.itemId} value={it.itemId}>
                        {it.nombre} (stock: {it.stockActual})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={ins.cantidad}
                    onChange={(e) =>
                      setInsumos(insumos.map((x, j) => (j === i ? { ...x, cantidad: Number(e.target.value) } : x)))
                    }
                    style={{ ...inputBase, width: 80 }}
                  />
                  <button
                    onClick={() => setInsumos(insumos.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setInsumos([...insumos, { itemId: 0, cantidad: 1 }])}
                style={{
                  background: "none",
                  border: "1px dashed var(--border)",
                  borderRadius: 8,
                  padding: "8px",
                  cursor: "pointer",
                  color: "var(--text-2)",
                }}
              >
                + Agregar insumo
              </button>
            </div>
          </section>

          {/* 12. Resumen */}
          <section>
            <p style={sectionLabel}>Resumen del Incidente</p>
            <textarea
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              rows={3}
              placeholder="Descripción breve del incidente…"
              style={{ ...inputBase, resize: "vertical", minHeight: 80 }}
            />
          </section>
        </div>

        {/* Sticky footer */}
        <div
          style={{
            background: "var(--bg-card)",
            borderTop: "1px solid var(--border)",
            padding: "16px 24px",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-2)",
              fontSize: 14,
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "var(--red)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: submitting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                Registrando...
              </>
            ) : (
              "Registrar Emergencia"
            )}
          </button>
        </div>
      </div>

      <AlertDialog
        isOpen={alertState.open}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        details={alertState.details}
      />
    </>
  );
}
