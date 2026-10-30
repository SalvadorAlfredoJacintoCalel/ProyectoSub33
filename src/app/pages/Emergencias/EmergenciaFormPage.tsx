import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, ArrowLeft, Lock, Phone, User, MapPin, ChevronDown, Truck, Heart, Loader2, Package,
} from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { Button } from "@/app/components/ui/button";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { readDraftValue } from "@/services/drafts/draftRegistry";
import { useEmergencias } from "@/hooks/useEmergencias";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { inventarioService } from "@/services/inventarioService";
import { vehiculosService } from "@/services/vehiculosService";
import { emergenciaService } from "@/services/emergenciaService";
import { HospitalAutocomplete } from "./components/HospitalAutocomplete";
import { CatalogAutocomplete } from "@/app/components/ui/CatalogAutocomplete";
import type { PersonalAsignado } from "@/types/emergencia";
import type { InventarioItem } from "@/types/inventario";
import type { Vehiculo } from "@/types/vehiculos";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  serviceId?: number;
  onClose: () => void;
  onSaved?: () => void;
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
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: "none",
  cursor: "pointer",
};

const errorField = (bad?: boolean): React.CSSProperties =>
  bad
    ? {
        border: "1px solid var(--brand-500)",
        boxShadow: "0 0 0 3px var(--red, var(--red))40",
        animation: "shake 0.4s ease-in-out",
      }
    : {};

const OpcionesGenero = ["Masculino", "Femenino"];

function getNow() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

function numOrUndefined(value: string): number | undefined {
  if (value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function normalizeRol(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function nombreVehiculo(v: Vehiculo): string {
  return v.noUnidad || v.codigo || `${v.marca} ${v.modelo}`.trim();
}

interface PersonalSel {
  personalId: string | null;
  nombre: string;
  rolServicioId: number | null;
}

interface EmergenciaDraft {
  tipoSolicitud: "Telefónica" | "Personal";
  tiempoSalida: string;
  tiempoLlegada: string;
  tipoEmergenciaId: string;
  tiposAsistencia: string[];
  ubicacion: string;
  hospitalDestinoId: string;
  nombrePaciente: string;
  edad: string;
  genero: string;
  solicitante: string;
  acompanante: string;
  fallecido: boolean;
  domicilio: string;
  presionArterial: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  saturacion: string;
  horaToma: string;
  estadoEntrega: string;
  vehiculoId: string;
  personalSeleccionado: PersonalSel[];
  resumen: string;
  fecha: string;
  insumos: { itemId: number; cantidad: number }[];
}

export function EmergenciaFormPage({ mode, serviceId, onClose, onSaved }: Props) {
  const isEdit = mode === "edit";
  const { catalogos, cargarCatalogos, getSiguienteIncidente, obtenerEmergencia, crearEmergencia, actualizarEmergencia } =
    useEmergencias();
  const { toast } = useAlert();
  const { user } = useAuth();
  const { emergencias: permisosEmergencias } = usePermisos();

  const [numeroIncidente, setNumeroIncidente] = useState("");
  const [tipoSolicitud, setTipoSolicitud] = useState<"Telefónica" | "Personal">("Telefónica");
  const [tiempoSalida, setTiempoSalida] = useState("");
  const [tiempoLlegada, setTiempoLlegada] = useState("");
  const [tipoEmergenciaId, setTipoEmergenciaId] = useState("");
  const [tipoEmergenciaTexto, setTipoEmergenciaTexto] = useState("");
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
  const [vehiculoId, setVehiculoId] = useState("");
  const [vehiculoAnexo, setVehiculoAnexo] = useState<Vehiculo | null>(null);
  const [personalSeleccionado, setPersonalSeleccionado] = useState<PersonalSel[]>([]);
  const [resumen, setResumen] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [insumos, setInsumos] = useState<{ itemId: number; cantidad: number }[]>([]);
  const [itemsDisponibles, setItemsDisponibles] = useState<InventarioItem[]>([]);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [personalMsg, setPersonalMsg] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formuladoPorIdOriginal, setFormuladoPorIdOriginal] = useState<string | null>(null);
  const [creadoPorNombreOriginal, setCreadoPorNombreOriginal] = useState("");

  const puedeEditar = isEdit
    ? permisosEmergencias.editarPropia(formuladoPorIdOriginal)
    : permisosEmergencias.crear;

  const [baselineDraft, setBaselineDraft] = useState<EmergenciaDraft | null>(null);

  const draftValue = useMemo<EmergenciaDraft>(
    () => ({
      tipoSolicitud,
      tiempoSalida,
      tiempoLlegada,
      tipoEmergenciaId,
      tiposAsistencia,
      ubicacion,
      hospitalDestinoId,
      nombrePaciente,
      edad,
      genero,
      solicitante,
      acompanante,
      fallecido,
      domicilio,
      presionArterial,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      saturacion,
      horaToma,
      estadoEntrega,
      vehiculoId,
      personalSeleccionado,
      resumen,
      fecha,
      insumos,
    }),
    [
      tipoSolicitud,
      tiempoSalida,
      tiempoLlegada,
      tipoEmergenciaId,
      tiposAsistencia,
      ubicacion,
      hospitalDestinoId,
      nombrePaciente,
      edad,
      genero,
      solicitante,
      acompanante,
      fallecido,
      domicilio,
      presionArterial,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      saturacion,
      horaToma,
      estadoEntrega,
      vehiculoId,
      personalSeleccionado,
      resumen,
      fecha,
      insumos,
    ]
  );

  const draftKey = isEdit && serviceId ? `emergencia.edit.${serviceId}` : "emergencia.create";
  const draftDirty = useMemo(
    () => Boolean(baselineDraft) && JSON.stringify(draftValue) !== JSON.stringify(baselineDraft),
    [draftValue, baselineDraft]
  );

  const { draft, savedAt, online, save, clear } = useFormDraft<EmergenciaDraft>(draftKey, {
    module: "emergencias",
    label: isEdit ? "Editar emergencia" : "Nueva emergencia",
    entityId: isEdit && serviceId ? String(serviceId) : null,
    username: user?.username ?? null,
    dirty: draftDirty,
  });

  const applyDraftToState = useCallback((d: EmergenciaDraft) => {
    setTipoSolicitud(d.tipoSolicitud);
    setTiempoSalida(d.tiempoSalida);
    setTiempoLlegada(d.tiempoLlegada);
    setTipoEmergenciaId(d.tipoEmergenciaId);
    setTiposAsistencia(d.tiposAsistencia);
    setUbicacion(d.ubicacion);
    setHospitalDestinoId(d.hospitalDestinoId);
    setNombrePaciente(d.nombrePaciente);
    setEdad(d.edad);
    setGenero(d.genero);
    setSolicitante(d.solicitante);
    setAcompanante(d.acompanante);
    setFallecido(d.fallecido);
    setDomicilio(d.domicilio);
    setPresionArterial(d.presionArterial);
    setFrecuenciaCardiaca(d.frecuenciaCardiaca);
    setFrecuenciaRespiratoria(d.frecuenciaRespiratoria);
    setSaturacion(d.saturacion);
    setHoraToma(d.horaToma);
    setEstadoEntrega(d.estadoEntrega);
    setVehiculoId(d.vehiculoId);
    setPersonalSeleccionado(d.personalSeleccionado);
    setResumen(d.resumen);
    setFecha(d.fecha);
    setInsumos(d.insumos);
  }, []);

  useEffect(() => {
    if (isEdit) return;
    setBaselineDraft({ ...draftValue });
    const saved = readDraftValue<EmergenciaDraft>("emergencia.create");
    if (saved) applyDraftToState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!baselineDraft) return;
    if (!draftDirty) {
      clear();
      return;
    }
    save(draftValue);
  }, [draftValue, draftDirty, baselineDraft, save, clear]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await cargarCatalogos();

      if (isEdit && serviceId) {
        const em = await obtenerEmergencia(serviceId);
        if (mounted && em) {
          setNumeroIncidente(em.numeroIncidente);
          setFormuladoPorIdOriginal(em.formuladoPorId ?? null);
          setCreadoPorNombreOriginal(em.creadoPorNombre ?? "");

          if (em.vehiculoId) {
            const anexo = await vehiculosService.getVehiculoById(em.vehiculoId).catch(() => null);
            if (mounted) setVehiculoAnexo(anexo);
          }

          const ins = await inventarioService
            .getServicioInsumos({ servicioId })
            .catch((error) => {
              console.error("Error cargando insumos del servicio:", error);
              return [];
            });
          if (!mounted) return;

          const serverDraft: EmergenciaDraft = {
            tipoSolicitud: em.solicitudTipo === "Personal" ? "Personal" : "Telefónica",
            tiempoSalida: em.horaSalida ?? "",
            tiempoLlegada: em.horaEntrada ?? "",
            tipoEmergenciaId: em.tipoEmergenciaId ? String(em.tipoEmergenciaId) : "",
            tiposAsistencia: em.tiposAsistencia ?? [],
            ubicacion: em.ubicacion ?? "",
            hospitalDestinoId: em.hospitalDestinoId ? String(em.hospitalDestinoId) : "",
            nombrePaciente: em.paciente ?? "",
            edad: em.edad ? String(em.edad) : "",
            genero: em.genero === "No especificado" ? "" : (em.genero ?? ""),
            solicitante: em.solicitante ?? "",
            acompanante: em.acompanante ?? "",
            fallecido: em.fallecio ?? false,
            domicilio: em.domicilio ?? "",
            presionArterial: em.signosVitales?.presionArterial ?? "",
            frecuenciaCardiaca:
              em.signosVitales?.frecuenciaCardiaca != null
                ? String(em.signosVitales.frecuenciaCardiaca)
                : "",
            frecuenciaRespiratoria:
              em.signosVitales?.frecuenciaRespiratoria != null
                ? String(em.signosVitales.frecuenciaRespiratoria)
                : "",
            saturacion:
              em.signosVitales?.saturacionOxigeno != null ? String(em.signosVitales.saturacionOxigeno) : "",
            horaToma: em.signosVitales?.horaToma ?? getNow(),
            estadoEntrega: em.estadoEntrega ?? "",
            vehiculoId: em.vehiculoId ? String(em.vehiculoId) : "",
            personalSeleccionado: (em.personalAsignado ?? []).map((p) => ({
              personalId: p.personalId ?? null,
              nombre: p.nombrePersonal,
              rolServicioId: p.rolServicioId ?? null,
            })),
            resumen: em.resumen ?? "",
            fecha: em.fecha ? em.fecha.split("T")[0] : new Date().toISOString().split("T")[0],
            insumos: (ins ?? []).map((x) => ({ itemId: x.itemId, cantidad: x.cantidad })),
          };

          setBaselineDraft(serverDraft);
          const saved = readDraftValue<EmergenciaDraft>(`emergencia.edit.${serviceId}`);
          applyDraftToState(saved ?? serverDraft);
        }
      } else {
        const correlativo = await getSiguienteIncidente();
        if (mounted && correlativo) setNumeroIncidente(correlativo);
      }

      } catch (error) {
        console.error("Error cargando la emergencia:", error);
        if (mounted) toast.error("No se pudo cargar la emergencia.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isEdit, serviceId, cargarCatalogos, obtenerEmergencia, getSiguienteIncidente, applyDraftToState]);

  useEffect(() => {
    let mounted = true;
    inventarioService
      .getItems({ pagina: 1, tamanio: 200 })
      .then((r) => {
        if (mounted) setItemsDisponibles(r.items);
      })
      .catch(() => {
        if (mounted) setItemsDisponibles([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tipoEmergenciaId) return;
    const match = catalogos.tiposEmergencia.find((t) => String(t.id) === tipoEmergenciaId);
    if (match && match.nombre !== tipoEmergenciaTexto) {
      setTipoEmergenciaTexto(match.nombre);
    }
  }, [tipoEmergenciaId, catalogos.tiposEmergencia, tipoEmergenciaTexto]);

  function toggleTipoAsistencia(tipo: string) {
    setTiposAsistencia((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
    setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
  }

  function agregarTipoAsistencia() {
    const valor = nuevoTipoAsistencia.trim();
    if (!valor) return;
    if (!tiposAsistencia.includes(valor)) {
      setTiposAsistencia([...tiposAsistencia, valor]);
    }
    setNuevoTipoAsistencia("");
    setErrors((prev) => ({ ...prev, tiposAsistencia: false }));
  }

  async function confirmarTipoEmergencia(valor: string) {
    const texto = valor.trim();
    if (!texto) return;

    const coincidencia = catalogos.tiposEmergencia.find(
      (t) => t.nombre.toLowerCase() === texto.toLowerCase()
    );
    if (coincidencia) {
      setTipoEmergenciaId(String(coincidencia.id));
      setTipoEmergenciaTexto(coincidencia.nombre);
      setErrors((prev) => ({ ...prev, tipoEmergenciaId: false }));
      return;
    }

    try {
      const nuevo = await emergenciaService.crearTipoEmergencia(texto);
      await cargarCatalogos();
      setTipoEmergenciaId(String(nuevo.id));
      setTipoEmergenciaTexto(nuevo.nombre);
      setErrors((prev) => ({ ...prev, tipoEmergenciaId: false }));
      toast.success("Tipo de emergencia agregado.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo crear el tipo de emergencia.";
      toast.error(msg);
    }
  }

  function togglePersonal(personalId: string, nombre: string) {
    setPersonalSeleccionado((prev) => {
      const existe = prev.find((p) => p.personalId === personalId);
      if (existe) return prev.filter((p) => p.personalId !== personalId);
      const rolDefault = catalogos.rolesServicio[0]?.id ?? null;
      return [...prev, { personalId, nombre, rolServicioId: rolDefault }];
    });
    setErrors((prev) => ({ ...prev, personalAsignado: false }));
    setPersonalMsg("");
  }

  function setRolPersonal(personalId: string, rolServicioId: number | null) {
    setPersonalSeleccionado((prev) =>
      prev.map((p) => (p.personalId === personalId ? { ...p, rolServicioId } : p))
    );
    setErrors((prev) => ({ ...prev, personalAsignado: false }));
    setPersonalMsg("");
  }

  const selectedIds = new Set(personalSeleccionado.map((p) => p.personalId));

  const personalLista = useMemo(() => {
    const base = catalogos.personal;
    const ids = new Set(base.map((p) => p.personalId));
    const extra = personalSeleccionado
      .filter((s) => s.personalId && !ids.has(s.personalId))
      .map((s) => ({
        personalId: s.personalId as string,
        codigo: "",
        codigoBombero: null,
        nombreCompleto: s.nombre,
        rangoNombre: null,
        estado: false,
      }));
    return [...base, ...extra];
  }, [catalogos.personal, personalSeleccionado]);

  const vehiculosOpciones = useMemo(() => {
    const base = catalogos.vehiculosDisponibles;
    if (!vehiculoAnexo || base.some((v) => v.vehiculoId === vehiculoAnexo.vehiculoId)) return base;
    return [...base, vehiculoAnexo];
  }, [catalogos.vehiculosDisponibles, vehiculoAnexo]);

  async function handleSubmit() {
    if (!puedeEditar) {
      toast.warning("Solo el creador de la emergencia o un administrador pueden modificarla.");
      return;
    }
    const newErrors: Record<string, boolean> = {};
    let personalErrorMsg = "";

    if (!tipoEmergenciaId) newErrors.tipoEmergenciaId = true;
    if (tiposAsistencia.length === 0) newErrors.tiposAsistencia = true;
    if (!ubicacion.trim()) newErrors.ubicacion = true;
    if (!nombrePaciente.trim()) newErrors.nombrePaciente = true;
    if (!hospitalDestinoId) newErrors.hospitalDestinoId = true;
    if (!vehiculoId) newErrors.vehiculoId = true;

    const edadNum = Number(edad);
    if (edad && (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 120)) newErrors.edad = true;

    const fc = Number(frecuenciaCardiaca);
    if (frecuenciaCardiaca !== "" && (Number.isNaN(fc) || fc < 0 || fc > 250)) newErrors.frecuenciaCardiaca = true;

    const fr = Number(frecuenciaRespiratoria);
    if (frecuenciaRespiratoria !== "" && (Number.isNaN(fr) || fr < 0 || fr > 100)) newErrors.frecuenciaRespiratoria = true;

    const sat = Number(saturacion);
    if (saturacion !== "" && (Number.isNaN(sat) || sat < 0 || sat > 100)) newErrors.saturacion = true;

    const idPiloto = catalogos.rolesServicio.find((r) => normalizeRol(r.nombre) === "piloto")?.id ?? null;
    const idCamillero = catalogos.rolesServicio.find((r) => normalizeRol(r.nombre) === "camillero")?.id ?? null;
    const idSocorrista = catalogos.rolesServicio.find((r) => normalizeRol(r.nombre) === "socorrista")?.id ?? null;
    const rolesSel = personalSeleccionado.map((p) => p.rolServicioId);
    const tienePiloto = idPiloto != null && rolesSel.includes(idPiloto);
    const tieneAcompanante =
      (idCamillero != null && rolesSel.includes(idCamillero)) ||
      (idSocorrista != null && rolesSel.includes(idSocorrista));
    const exigePiloto = idPiloto != null;
    const exigeAcompanante = idCamillero != null || idSocorrista != null;
    const faltaRol = personalSeleccionado.some((p) => p.rolServicioId == null);

    if (personalSeleccionado.length === 0) {
      newErrors.personalAsignado = true;
      personalErrorMsg = "Debe asignar el personal que atendió la emergencia.";
    } else if (personalSeleccionado.length < 2) {
      newErrors.personalAsignado = true;
      personalErrorMsg = "Debe asignar al menos 2 personas.";
    } else if (faltaRol) {
      newErrors.personalAsignado = true;
      personalErrorMsg = "Asigna un rol a cada persona asignada.";
    } else if (exigePiloto && !tienePiloto) {
      newErrors.personalAsignado = true;
      personalErrorMsg = "El personal asignado debe incluir un Piloto.";
    } else if (exigeAcompanante && !tieneAcompanante) {
      newErrors.personalAsignado = true;
      personalErrorMsg = "El personal asignado debe incluir un acompañante (Camillero o Socorrista).";
    }

    setPersonalMsg(personalErrorMsg);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning(personalErrorMsg || "Complete los datos obligatorios marcados en rojo.");
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
        vehiculoId: Number(vehiculoId),
        formuladoPorId: isEdit ? (formuladoPorIdOriginal ?? undefined) : (user?.personalId ?? undefined),
        creadoPorNombre: isEdit
          ? (creadoPorNombreOriginal || undefined)
          : (user?.name || user?.username || undefined),
        personalAsignado,
        signosVitales: {
          presionArterial: presionArterial || undefined,
          frecuenciaCardiaca: numOrUndefined(frecuenciaCardiaca),
          frecuenciaRespiratoria: numOrUndefined(frecuenciaRespiratoria),
          saturacionOxigeno: numOrUndefined(saturacion),
          horaToma,
        },
        resumen: resumen || undefined,
        insumosUtilizados: insumos
          .filter((i) => i.itemId > 0 && i.cantidad > 0)
          .map((i) => ({ itemId: i.itemId, cantidad: i.cantidad })),
      };

      if (isEdit && serviceId) {
        const actualizada = await actualizarEmergencia(serviceId, dto);
        if (actualizada) {
          toast.success(`Incidente ${actualizada.numeroIncidente} actualizado exitosamente`);
          clear();
          onSaved?.();
          onClose();
        } else {
          toast.error("No se pudieron guardar los cambios. Intente nuevamente.");
        }
      } else {
        const resultado = await crearEmergencia(dto);
        if (resultado && resultado.exito) {
          toast.success(`Incidente ${resultado.numeroIncidente} registrado exitosamente`);
          clear();
          onSaved?.();
          onClose();
        } else {
          toast.error("No se pudo registrar la emergencia. Intente nuevamente.");
        }
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      toast.error(mensaje);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    clear();
    onClose();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
        <div className="rounded-2xl p-10 flex flex-col items-center gap-4" style={{ background: "var(--bg-card)" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--red)" }} />
          <span style={{ color: "var(--text-2)", fontSize: 14 }}>Cargando emergencia…</span>
        </div>
      </div>
    );
  }

  const titulo = isEdit ? `Editar Emergencia — ${numeroIncidente}` : "Registrar Emergencia";

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
              aria-label="Volver"
            >
              <ArrowLeft style={{ width: 20, height: 20 }} />
            </button>
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
              {titulo}
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
          <DraftBanner draft={draft} online={online} onDiscard={clear} />

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
              <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <input
                list="tiposEmergenciaList"
                value={tipoEmergenciaTexto}
                onChange={(e) => {
                  const valor = e.target.value;
                  setTipoEmergenciaTexto(valor);
                  const coincidencia = catalogos.tiposEmergencia.find(
                    (t) => t.nombre.toLowerCase() === valor.trim().toLowerCase()
                  );
                  if (coincidencia) {
                    setTipoEmergenciaId(String(coincidencia.id));
                    setErrors((prev) => ({ ...prev, tipoEmergenciaId: false }));
                  } else {
                    setTipoEmergenciaId("");
                  }
                }}
                onBlur={() => {
                  const valor = tipoEmergenciaTexto.trim();
                  if (valor) void confirmarTipoEmergencia(valor);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const valor = tipoEmergenciaTexto.trim();
                    if (valor) void confirmarTipoEmergencia(valor);
                  }
                }}
                placeholder="Escriba o seleccione el tipo de emergencia..."
                style={{ ...inputBase, ...errorField(errors.tipoEmergenciaId) }}
              />
              <button
                type="button"
                onClick={() => {
                  const valor = tipoEmergenciaTexto.trim();
                  if (valor) void confirmarTipoEmergencia(valor);
                }}
                disabled={!tipoEmergenciaTexto.trim()}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "1px solid var(--brand-500)",
                  background: "var(--brand-50)",
                  color: "var(--brand-600)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: tipoEmergenciaTexto.trim() ? 1 : 0.5,
                }}
              >
                + Agregar
              </button>
            </div>
            <datalist id="tiposEmergenciaList">
              {catalogos.tiposEmergencia.map((t) => (
                <option key={t.id} value={t.nombre} />
              ))}
            </datalist>
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
              <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
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
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
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
                onBlur={() => {
                  if (nuevoTipoAsistencia.trim()) agregarTipoAsistencia();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nuevoTipoAsistencia.trim()) {
                    e.preventDefault();
                    agregarTipoAsistencia();
                  }
                }}
                placeholder="Escriba o seleccione..."
                style={{ ...inputBase, ...errorField(errors.tiposAsistencia) }}
              />
              <button
                type="button"
                onClick={agregarTipoAsistencia}
                disabled={!nuevoTipoAsistencia.trim()}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "1px solid var(--brand-500)",
                  background: "var(--brand-50)",
                  color: "var(--brand-600)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: nuevoTipoAsistencia.trim() ? 1 : 0.5,
                }}
              >
                + Agregar
              </button>
            </div>
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
              <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
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
                  ...errorField(errors.ubicacion),
                }}
              />
            </div>
          </section>

          {/* 7. Hospital de Destino */}
          <section>
            <p style={sectionLabel}>
              Hospital de Destino
              <span style={{ color: "var(--red)", fontSize: 13, marginLeft: 4 }}>*</span>
            </p>
            <HospitalAutocomplete
              value={hospitalDestinoId}
              onChange={(id) => {
                setHospitalDestinoId(id);
                setErrors((prev) => ({ ...prev, hospitalDestinoId: false }));
              }}
              hospitales={catalogos.hospitales}
              error={errors.hospitalDestinoId}
              onCreate={async (nombre) => {
                const nuevo = await emergenciaService.crearHospital(nombre);
                await cargarCatalogos();
                return nuevo;
              }}
            />
          </section>

          {/* 8. Datos del Paciente */}
          <section>
            <p style={sectionLabel}>Datos del Paciente</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Nombre Completo <span style={{ color: "var(--red)" }}>*</span>
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
                    ...errorField(errors.nombrePaciente),
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
                      ...errorField(errors.edad),
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
                      background: !fallecido ? "var(--success-600)" : "var(--bg-input)",
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
                    ...errorField(errors.frecuenciaCardiaca),
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
                  onChange={(e) => {
                    setFrecuenciaRespiratoria(e.target.value);
                    setErrors((prev) => ({ ...prev, frecuenciaRespiratoria: false }));
                  }}
                  placeholder="16"
                  style={{ ...inputBase, ...errorField(errors.frecuenciaRespiratoria) }}
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
                    ...errorField(errors.saturacion),
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
                <CatalogAutocomplete
                  tipo="estados-entrega"
                  valueIsName
                  value={estadoEntrega}
                  onChange={(nombre) => setEstadoEntrega(nombre)}
                  placeholder="Seleccionar o crear estado..."
                />
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
                Unidad (es) destacada (s) <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={vehiculoId}
                  onChange={(e) => {
                    setVehiculoId(e.target.value);
                    setErrors((prev) => ({ ...prev, vehiculoId: false }));
                  }}
                  style={{
                    ...selectBase,
                    paddingRight: 32,
                    ...errorField(errors.vehiculoId),
                  }}
                >
                  <option value="">Seleccionar unidad…</option>
                  {vehiculosOpciones.map((v) => {
                    const noDisponible =
                      vehiculoAnexo?.vehiculoId === v.vehiculoId &&
                      (v.estado !== "Activo" || v.estadoOperativo !== "Operativa");
                    return (
                      <option key={v.vehiculoId} value={v.vehiculoId}>
                        {nombreVehiculo(v)}{noDisponible ? " (no disponible)" : ""}
                      </option>
                    );
                  })}
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
                Personal <span style={{ color: "var(--red)", marginLeft: 4 }}>*</span>
              </label>
              {personalLista.length === 0 ? (
                <p style={{ color: "var(--text-2)", fontSize: 12, margin: "8px 0" }}>Sin personal disponible</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {personalLista.map((p) => {
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
                          background: selected ? "var(--brand-50)" : "var(--bg-input)",
                          ...errorField(errors.personalAsignado && !selected),
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
                          <div style={{ position: "relative", width: 160 }}>
                            <CatalogAutocomplete
                              tipo="roles-servicio"
                              value={personalSeleccionado.find((s) => s.personalId === p.personalId)?.rolServicioId ? String(personalSeleccionado.find((s) => s.personalId === p.personalId)?.rolServicioId) : ""}
                              onChange={(id) => setRolPersonal(p.personalId, id ? Number(id) : null)}
                              placeholder="Rol…"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.personalAsignado && personalMsg && (
                <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{personalMsg}</p>
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
          <Button variant="brand-outline" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSubmit} disabled={submitting || !puedeEditar}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                {isEdit ? "Guardando..." : "Registrando..."}
              </>
            ) : (
              isEdit ? "Guardar Cambios" : "Registrar Emergencia"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
