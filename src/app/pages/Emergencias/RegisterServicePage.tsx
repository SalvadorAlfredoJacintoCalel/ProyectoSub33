import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, X, Lock, Phone, User, MapPin, ChevronDown, Truck, Heart, Activity } from "lucide-react";

interface Props {
  onClose: () => void;
  currentUser?: string;
  nextId?: string;
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

function getNow() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export function RegisterServicePage({
  onClose,
  currentUser = "Bombero García Soc",
  nextId = "INC-2026-001",
}: Props) {
  // Form state
  const [tipoSolicitud, setTipoSolicitud] = useState<"Telefónica" | "Personal">("Telefónica");
  const [tiempoSalida, setTiempoSalida] = useState("");
  const [tiempoLlegada, setTiempoLlegada] = useState("");
  const [tiposAsistencia, setTiposAsistencia] = useState<string[]>(["Accidente de Tránsito", "Atención Médica / Enfermedad Common", "Maternidad / Parto", "Incendio Estructural", "Rescate / Salvamento"]);
  const [ubicacion, setUbicacion] = useState("");
  const [hospital, setHospital] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [acompanante, setAcompanante] = useState("");
  const [fallecido, setFallecido] = useState(false);
  const [presionArterial, setPresionArterial] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [estadoEntrega, setEstadoEntrega] = useState("");
  const [unidad, setUnidad] = useState("");
  const [personalDisponible, setPersonalDisponible] = useState<any[]>(["Bombero 1.º Juan Pérez", "Socorrista María López", "Voluntario Carlos Gutiérrez"]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"warning" | "success">("warning");
  const [modalMessage, setModalMessage] = useState<string>("");
  const [numeroIncidente, setNumeroIncidente] = useState<string>("INC-2026-001");
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (modalOpen) {
      timer = setTimeout(() => setModalOpen(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [modalOpen]);

  function toggleTipoAsistencia(tipo: string) {
    setTiposAsistencia((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
    setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
  }

  function togglePersonal(nombre: string) {
    setPersonalDisponible((prev) =>
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
      setModalOpen(true);
      setModalType("warning");
      setModalMessage("Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }

    // Simulación: Mostrar modal de éxito sin hacer petición HTTP
    setModalOpen(true);
    setModalType("success");
    setModalMessage("¡Servicio registrado exitosamente! El expediente ha sido guardado.");

    // Resetear campos de formulario visualmente
    setTipoSolicitud("Telefónica");
    setTiempoSalida("");
    setTiempoLlegada("");
    setTiposAsistencia([]);
    setUbicacion("");
    setHospital("");
    setNombrePaciente("");
    setEdad("");
    setGenero("");
    setSolicitante("");
    setAcompanante("");
    setFallecido(false);
    setPresionArterial("");
    setFrecuenciaCardiaca("");
    setFrecuenciaRespiratoria("");
    setSaturacion("");
    setEstadoEntrega("");
    setUnidad("");
    setPersonalDisponible([]);
    setFecha(new Date().toISOString().split('T')[0]);
    setDomicilio("");
    setHoraToma(new Date().toTimeString().slice(0, 5));
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
              onClick={() => {
                setSubmitted(false);
                setTipoSolicitud("Telefónica");
                setTiempoSalida("");
                setTiempoLlegada("");
                setTiposAsistencia([]);
                setUbicacion("");
                setHospital("");
                setNombrePaciente("");
                setEdad("");
                setGenero("");
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
                // Refrescar correlativo de incidente
                fetch("http://localhost:5196/api/emergencias/siguiente-incidente")
                  .then((res) => res.json())
                  .then((data) => setNumeroIncidente(data.numeroIncidente))
                  .catch((err) => {
                    console.error("Error al actualizar correlativo:", err);
                    setNumeroIncidente("INC-2026-016");
                  });
                // Propagate original onClose if provided
                if (onClose) onClose();
              }}
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
          {tiposAsistencia.length === 0 ? (
            <p style={{ color: "var(--text-2)", fontSize: 12, margin: "8px 0" }}>Sin opciones disponibles</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tiposAsistencia.map((tipo) => {
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
          )}
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
              <option value="Hospital Nacional de Sololá">Hospital Nacional de Sololá</option>
              <option value="Centro de Salud San Lucas Tolimán">Centro de Salud San Lucas Tolimán</option>
              <option value="IGSS Regional">IGSS Regional</option>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Edad
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="—"
                  min={0}
                  max={120}
                  style={{ ...inputBase, width: 80 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Género
                </label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  style={{ ...selectBase, paddingRight: 32 }}
                >
                  <option value="" disabled>Seleccione una opción</option>
                  {OpcionesGenero.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
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
                type="text"
                inputMode="numeric"
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
                type="text"
                inputMode="numeric"
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
                type="text"
                inputMode="numeric"
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
              <option value="Estable">Estable</option>
              <option value="Delicado">Delicado</option>
              <option value="Grave">Grave</option>
              <option value="Fallecido en traslado">Fallecido en traslado</option>
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
              <option value="Unidad A-33 (Ambulancia)">Unidad A-33 (Ambulancia)</option>
              <option value="Unidad B-12 (Autobomba)">Unidad B-12 (Autobomba)</option>
              <option value="Unidad R-5 (Rescate)">Unidad R-5 (Rescate)</option>
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
            {personalDisponible.length === 0 ? (
              <p style={{ color: "var(--text-2)", fontSize: 12, margin: "8px 0" }}>Sin personal disponible</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {personalDisponible.map((nombre) => {
                  const selected = personalDisponible.includes(nombre);
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
            )}
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
    {modalOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      >
        <div
          className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95"
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
          >
            <h3
              className="font-medium text-lg text-gray-900"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              {modalType === "warning" ? "Campos Incompletos" : "Registro Exitoso"}
            </h3>
            <button
              onClick={() => setModalOpen(false)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-3)" }}
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${modalType === "warning" ? "bg-yellow-100 text-yellow-600 border border-yellow-500" : "bg-green-100 text-green-600 border border-green-500"}`}
            >
              {modalType === "warning" ? (
                <svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="12" x2="16" y2="16" />
                </svg>
              ) : (
                <CheckCircle style={{ width: 24, height: 24, color: "currentColor" }} />
              )}
            </div>
            <p
              className="text-center text-gray-600"
              style={{ fontSize: "14px", lineHeight: "1.5" }}
            >
              {modalMessage}
            </p>
          </div>
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={() => setModalOpen(false)}
              className="w-full rounded-lg py-2.5 px-4 text-white font-medium transition-colors"
              style={{
                background: modalType === "warning" ? "var(--red)" : "#16a34a",
                fontFamily: "inherit",
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
