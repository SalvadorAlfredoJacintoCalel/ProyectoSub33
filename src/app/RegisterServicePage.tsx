import { useState, useEffect } from "react";
import { Lock, Phone, User, MapPin, X, ChevronDown, Truck, Heart, Activity } from "lucide-react";

interface Props {
  onClose: () => void;
  currentUser?: string;
  nextId?: string;
}

const TIPOS_ASISTENCIA = [
  "Médico / Rescate",
  "Incendio",
  "Accidente Tránsito",
  "Maternidad",
  "Servicios Especiales",
  "Materiales Peligrosos",
];

const HOSPITALES = [
  "Hospitalito HOSMG",
  "C.A.P",
  "Clínica Vida",
  "Hospital Nacional de Sololá",
  "Hospital Roosevelt",
  "H.N. San Juan de Dios",
  "Otro",
];

const UNIDADES = [
  "A-33 — Ambulancia",
  "BD-01 — Auto Bomba",
  "1419 — Motobomba",
  "Acuática",
  "854 — Incendios",
];

const PERSONAL = [
  "García Ajú, J.",
  "Morales Pérez, M.",
  "Tuc Ixchoy, R.",
  "Sajquiy Ajú, C.",
  "Caal Tun, B.",
  "Pocop Ajú, F.",
];

const ESTADO_ENTREGA = [
  "Estable",
  "Crítico",
  "Grave",
  "Mejorado",
  "Fallecido en escena",
  "Sin signos vitales al llegar",
];

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

function getNow() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export function RegisterServicePage({
  onClose,
  currentUser = "Bombero García Soc",
  nextId = "INC-2026-016",
}: Props) {
  // Form state
  const [tipoSolicitud, setTipoSolicitud] = useState<"Telefónica" | "Personal">("Telefónica");
  const [tiempoSalida, setTiempoSalida] = useState("");
  const [tiempoLlegada, setTiempoLlegada] = useState("");
  const [tiposAsistencia, setTiposAsistencia] = useState<string[]>([]);
  const [ubicacion, setUbicacion] = useState("");
  const [hospital, setHospital] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("No especificado");
  const [solicitante, setSolicitante] = useState("");
  const [acompanante, setAcompanante] = useState("");
  const [fallecido, setFallecido] = useState(false);
  const [presionArterial, setPresionArterial] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [estadoEntrega, setEstadoEntrega] = useState("");
  const [unidad, setUnidad] = useState("");
  const [personalSeleccionado, setPersonalSeleccionado] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [numeroIncidente, setNumeroIncidente] = useState<string>("INC-2026-016");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [domicilio, setDomicilio] = useState("");
  const [horaToma, setHoraToma] = useState(() => new Date().toTimeString().slice(0, 5));

  // Obtener correlativo de incidente al montar
  useEffect(() => {
    fetch("http://localhost:5196/api/emergencias/siguiente-incidente")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.numeroIncidente) {
          setNumeroIncidente(data.numeroIncidente);
        }
      })
      .catch((err) => {
        console.error("Error al obtener correlativo:", err);
      });
  }, []); 

  function toggleTipoAsistencia(tipo: string) {
    setTiposAsistencia((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
    setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
  }

  function togglePersonal(nombre: string) {
    setPersonalSeleccionado((prev) =>
      prev.includes(nombre) ? prev.filter((n) => n !== nombre) : [...prev, nombre]
    );
  }

  function handleSubmit() {
    const newErrors: Record<string, boolean> = {};
    if (tiposAsistencia.length === 0) newErrors.tiposAsistencia = true;
    if (!ubicacion.trim()) newErrors.ubicacion = true;
    if (!nombrePaciente.trim()) newErrors.nombrePaciente = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowError(true);
      return;
    }

    const payload = {
      numeroIncidente: numeroIncidente,
      fecha: fecha,
      horaSalida: tiempoSalida || null,
      horaEntrada: tiempoLlegada || null,
      solicitudTipo: tipoSolicitud || "Telefónica",
      paciente: nombrePaciente,
      edad: edad ? parseInt(edad) : null,
      genero: genero || "No especificado",
      solicitante: solicitante || null,
      acompanante: acompanante || null,
      domicilio: domicilio || null,
      fallecio: Boolean(fallecido),
      ubicacion: ubicacion,
      hospitalDestinoNombre: hospital || null,
      estadoEntrega: estadoEntrega || null,
      unidadAsignadaNombre: unidad || null,
      creadoPorNombre: currentUser || "Bombero",
      resumen: null,
      tiposAsistencia: Array.isArray(tiposAsistencia) ? tiposAsistencia : [],
      personalAsignado: personalSeleccionado ? personalSeleccionado.map((p: any) => ({
        nombrePersonal: typeof p === 'string' ? p : (p.nombrePersonal || p.nombre || ''),
        rolEnServicio: p.rolEnServicio || p.rol || 'Socorrista'
      })) : [],
      signosVitales: {
        presionArterial: presionArterial || null,
        frecuenciaCardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
        frecuenciaRespiratoria: frecuenciaRespiratoria ? parseInt(frecuenciaRespiratoria) : null,
        saturacionOxigeno: saturacion ? parseInt(saturacion) : null,
        horaToma: horaToma || null
      }
    };

    // Conexion Backend APi
    fetch("http://localhost:5196/api/emergencias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          alert("¡Servicio registrado exitosamente!");
          setSubmitted(true);
          setShowError(false);
          // Reset form state
          setTipoSolicitud("Telefónica");
          setTiempoSalida("");
          setTiempoLlegada("");
          setTiposAsistencia([]);
          setUbicacion("");
          setHospital("");
          setNombrePaciente("");
          setEdad("");
          setGenero("No especificado");
          setSolicitante("");
          setAcompanante("");
          setFallecido(false);
          setPresionArterial("");
          setFrecuenciaCardiaca("");
          setFrecuenciaRespiratoria("");
          setSaturacion("");
          setEstadoEntrega("");
          setUnidad("");
          setPersonalSeleccionado([]);
          setFecha(new Date().toISOString().split('T')[0]);
          setDomicilio("");
          setHoraToma(new Date().toTimeString().slice(0, 5));
          // Actualizar número de incidente para el siguiente registro
          fetch("http://localhost:5196/api/emergencias/siguiente-incidente")
            .then((res) => res.json())
            .then((data) => setNumeroIncidente(data.numeroIncidente))
            .catch((err) => {
              console.error("Error al actualizar número de incidente:", err);
              setNumeroIncidente("INC-2026-017");
            });
        } else {
          response.text().then((errText) => {
            alert("Error Backend:\n" + errText);
          });
        }
      })
      .catch(() => {
        alert("Error de conexión");
      });
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
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
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#16a34a22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity style={{ width: 32, height: 32, color: "#16a34a" }} />
          </div>
          <h2
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-1)",
              margin: 0,
            }}
          >
            Emergencia Registrada
          </h2>
          <p style={{ color: "var(--text-2)", fontSize: 14, margin: 0 }}>
            El incidente ha sido registrado exitosamente
          </p>
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-1)",
              letterSpacing: "0.05em",
              fontFamily: "monospace",
            }}
          >
{numeroIncidente}
          </div>
          <button
            onClick={onClose}
            style={{
              marginTop: 8,
              background: "var(--red)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
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
          <div
            style={{
              width: 3,
              height: 24,
              borderRadius: 2,
              background: "var(--red)",
            }}
          />
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
              style={{
                ...inputBase,
                paddingLeft: 32,
                color: "var(--text-3)",
                cursor: "default",
              }}
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

        {/* 3. Tiempos de Atención */}
        <section>
          <p style={sectionLabel}>Tiempos de Atención</p>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Salida */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
                Salida
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="time"
                  value={tiempoSalida}
                  onChange={(e) => setTiempoSalida(e.target.value)}
                  style={{ ...inputBase, flex: 1, padding: "8px 10px" }}
                />
                <button
                  onClick={() => setTiempoSalida(getNow())}
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
            {/* Llegada */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
                Llegada
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="time"
                  value={tiempoLlegada}
                  onChange={(e) => setTiempoLlegada(e.target.value)}
                  style={{ ...inputBase, flex: 1, padding: "8px 10px" }}
                />
                <button
                  onClick={() => setTiempoLlegada(getNow())}
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
          </div>
        </section>

        {/* 4. Tipo de Asistencia */}
        <section>
          <p style={sectionLabel}>
            Tipo de Asistencia
            {errors.tiposAsistencia && (
              <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
            )}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TIPOS_ASISTENCIA.map((tipo) => {
              const selected = tiposAsistencia.includes(tipo);
              return (
                <button
                  key={tipo}
                  onClick={() => toggleTipoAsistencia(tipo)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: selected ? "none" : "1px solid var(--border)",
                    background: selected ? "var(--red)" : "var(--bg-input)",
                    color: selected ? "#fff" : "var(--text-2)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    boxShadow: errors.tiposAsistencia && !selected
                      ? "0 0 0 3px var(--red, #c11d1d)40"
                      : "none",
                  }}
                >
                  {tipo}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Ubicación del Incidente */}
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

        {/* 6. Hospital de Destino */}
        <section>
          <p style={sectionLabel}>Hospital de Destino</p>
          <div style={{ position: "relative" }}>
            <select
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              style={{ ...selectBase, paddingRight: 32 }}
            >
              <option value="">Seleccionar hospital…</option>
              {HOSPITALES.map((h) => (
                <option key={h} value={h}>
                  {h}
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

        {/* 7. Datos del Paciente */}
        <section>
          <p style={sectionLabel}>Datos del Paciente</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Nombre Completo */}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Nombre Completo{" "}
                {errors.nombrePaciente && (
                  <span style={{ color: "var(--red)" }}>*</span>
                )}
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
            {/* Edad + Género */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ width: 80 }}>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Edad
                </label>
                <input
                  type="number"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="—"
                  min={0}
                  max={120}
                  style={{ ...inputBase, width: 80 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Género
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    style={{ ...selectBase, paddingRight: 32 }}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="No especificado">No especificado</option>
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
            {/* Solicitante */}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Solicitante
              </label>
              <input
                type="text"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                placeholder="Nombre del solicitante"
                style={inputBase}
              />
            </div>
            {/* Acompañante */}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Acompañante
              </label>
              <input
                type="text"
                value={acompanante}
                onChange={(e) => setAcompanante(e.target.value)}
                placeholder="Nombre del acompañante"
                style={inputBase}
              />
            </div>
            {/* Fallecido toggle */}
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

        {/* 8. Evaluación del Paciente / Signos Vitales */}
        <section>
          <p style={sectionLabel}>
            <Heart style={{ width: 13, height: 13, color: "var(--red)" }} />
            Evaluación del Paciente / Signos Vitales
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            {/* Presión Arterial */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Presión Arterial (mmHg)
              </label>
              <input
                type="text"
                value={presionArterial}
                onChange={(e) => setPresionArterial(e.target.value)}
                placeholder="120/80"
                style={inputBase}
              />
            </div>
            {/* Frecuencia Cardíaca */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Frecuencia Cardíaca (BPM)
              </label>
              <input
                type="number"
                value={frecuenciaCardiaca}
                onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                placeholder="72"
                style={inputBase}
              />
            </div>
            {/* Frecuencia Respiratoria */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Frecuencia Respiratoria (resp/min)
              </label>
              <input
                type="number"
                value={frecuenciaRespiratoria}
                onChange={(e) => setFrecuenciaRespiratoria(e.target.value)}
                placeholder="16"
                style={inputBase}
              />
            </div>
            {/* Saturación de Oxígeno */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                Saturación de Oxígeno (%SpO₂)
              </label>
              <input
                type="number"
                value={saturacion}
                onChange={(e) => setSaturacion(e.target.value)}
                placeholder="98"
                style={inputBase}
              />
            </div>
          </div>
          {/* Estado al Entregar */}
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
                {ESTADO_ENTREGA.map((e) => (
                  <option key={e} value={e}>
                    {e}
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
        </section>

        {/* 9. Recursos Asignados */}
        <section>
          <p style={sectionLabel}>
            <Truck style={{ width: 13, height: 13 }} />
            Recursos Asignados
          </p>
          {/* Unidad / Vehículo */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
              Unidad / Vehículo
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                style={{ ...selectBase, paddingRight: 32 }}
              >
                <option value="">Seleccionar unidad…</option>
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
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
          {/* Personal */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
              Personal
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PERSONAL.map((nombre) => {
                const selected = personalSeleccionado.includes(nombre);
                return (
                  <button
                    key={nombre}
                    onClick={() => togglePersonal(nombre)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: selected ? "none" : "1px solid var(--border)",
                      background: selected ? "var(--red)" : "var(--bg-input)",
                      color: selected ? "#fff" : "var(--text-2)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    {nombre}
                    {selected && (
                      <X style={{ width: 11, height: 11, marginLeft: 2 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
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
        {showError && (
          <span style={{ fontSize: 12, color: "var(--red)", flex: 1 }}>
            Completa los campos requeridos
          </span>
        )}
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-2)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: "var(--red)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Registrar Emergencia
        </button>
      </div>
    </div>
  );
}
