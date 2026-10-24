import { useState, useRef, useEffect } from "react";
import { X, Shield, User, Camera, KeyRound } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { Modal } from "@/app/components/ui/modal";
import { Badge } from "@/app/components/ui/badge";
import { useAlert } from "@/app/components/ui/AlertContext";
import { getPersonalById, type PersonalResponse } from "@/services/personalService";
import { cambiarContrasena, enviarCodigo2fa } from "@/services/authService";

type Props = {
  onClose: () => void;
  userName: string;
  avatarUrl: string | null;
  onAvatarSave: (base64: string) => void;
  personalId: string | null;
};

function AvatarPlaceholder({ initials, url }: { initials: string; url: string | null }) {
  if (url) {
    return (
      <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "var(--grad-primary-soft)" }}>
        <img src={url} alt="avatar" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "var(--grad-primary)" }}>
      <span className="text-4xl font-extrabold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{initials}</span>
    </div>
  );
}

async function getCroppedBase64(imageSrc: string, area: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{value || "—"}</p>
    </div>
  );
}

export function ProfilePage({ onClose, userName, avatarUrl, onAvatarSave, personalId }: Props) {
  const { toast } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [personal, setPersonal] = useState<PersonalResponse | null>(null);

  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [codigo2fa, setCodigo2fa] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const parts = (userName || "Usuario").trim().split(/\s+/).filter(Boolean);
  const initials = (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.[0] ?? "U")).toUpperCase();

  useEffect(() => {
    if (!personalId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getPersonalById(personalId);
        if (!cancelled) setPersonal(data);
      } catch {
        // sin datos de personal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personalId]);

  function handleFileSelected(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropSave() {
    if (!cropSrc || !croppedAreaPixels) return;
    const base64 = await getCroppedBase64(cropSrc, croppedAreaPixels);
    onAvatarSave(base64);
    setCropSrc(null);
    setCroppedAreaPixels(null);
  }

  async function handleEnviarCodigo() {
    setEnviando(true);
    const result = await enviarCodigo2fa();
    setEnviando(false);
    if (result.success) {
      setCodigoEnviado(true);
      toast.success(result.mensaje || "Código enviado a tu correo.");
    } else {
      toast.error(result.error || "No se pudo enviar el código.");
    }
  }

  async function handleCambiarContrasena() {
    if (nuevaContrasena.length < 8) {
      toast.warning("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (!codigo2fa.trim()) {
      toast.warning("Ingresa el código de verificación enviado a tu correo.");
      return;
    }
    setGuardando(true);
    const result = await cambiarContrasena(nuevaContrasena, codigo2fa.trim());
    setGuardando(false);
    if (result.success) {
      toast.success("Contraseña cambiada correctamente.");
      setNuevaContrasena("");
      setConfirmarContrasena("");
      setCodigo2fa("");
      setCodigoEnviado(false);
    } else {
      toast.error(result.error || "No se pudo cambiar la contraseña.");
    }
  }

  const tabs: TabItem[] = [
    {
      id: "perfil",
      label: "Perfil",
      icon: <User size={15} />,
      content: (
        <div className="flex flex-col gap-4">
          <InfoRow label="Nombre Completo" value={personal?.nombreCompleto ?? userName ?? "Usuario"} />
          <InfoRow label="Rango" value={personal?.rangoNombre ?? "—"} />
          <InfoRow label="Rol del Sistema" value={personal?.usuario?.rol ?? "—"} />
          <InfoRow label="Teléfono" value={personal?.telefono ?? "—"} />
          <InfoRow label="Código de Bombero" value={personal?.codigoBombero ?? "—"} />
          <InfoRow label="Usuario del Sistema" value={personal?.usuario?.username ?? "—"} />
        </div>
      ),
    },
    {
      id: "seguridad",
      label: "Seguridad",
      icon: <Shield size={15} />,
      content: (
        <div className="flex flex-col gap-4">
          <PasswordField
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            placeholder="Repetir contraseña"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
          />

          <Button variant="outline" onClick={handleEnviarCodigo} disabled={enviando}>
            <KeyRound size={14} /> {enviando ? "Enviando..." : "Enviar código"}
          </Button>

          {codigoEnviado && (
            <>
              <Input
                label="Código de verificación"
                placeholder="6 dígitos"
                inputMode="numeric"
                maxLength={6}
                value={codigo2fa}
                onChange={(e) => setCodigo2fa(e.target.value.replace(/\D/g, ""))}
              />
              <Button variant="brand" onClick={handleCambiarContrasena} disabled={guardando}>
                {guardando ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 sm:gap-8 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 animate-page-enter">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-['Manrope:ExtraBold',sans-serif] text-[28px] sm:text-[36px] font-extrabold leading-tight tracking-[-1.5px]" style={{ color: "var(--text-1)" }}>
            MI PERFIL DE BOMBERO
          </h1>
          <p className="mt-1 text-[16px]" style={{ color: "var(--text-2)" }}>
            Información personal y credenciales institucionales
          </p>
        </div>
        <button onClick={onClose} className="mt-2 shrink-0 rounded-lg p-2 transition-colors hover:bg-black/5">
          <X size={20} style={{ color: "var(--text-3)" }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] items-start gap-6 lg:gap-8 pb-12">
        <div className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex flex-col items-center justify-center px-5 pb-6 pt-10" style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--divider)" }}>
            <AvatarPlaceholder initials={initials} url={avatarUrl} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4">
              <Camera className="size-4" /> Subir Nueva Foto
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
              }}
            />
          </div>
          <div className="flex flex-col gap-4 px-5 py-5">
            <InfoRow label="Nombre Completo" value={userName || "Usuario"} />
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Rango</p>
              <Badge variant="brand">{personal?.rangoNombre ?? "—"}</Badge>
            </div>
            <InfoRow label="Compañía" value="Sub 33 San Lucas Tolimán - Sololá" />
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <Tabs variant="glass" tabs={tabs} />
        </div>
      </div>

      <Modal open={!!cropSrc} onClose={() => setCropSrc(null)} title="Recortar foto" size="md">
        <div className="relative h-[320px] w-full overflow-hidden rounded-lg" style={{ background: "#111" }}>
          {cropSrc && (
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            />
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <label className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <Button variant="brand" onClick={handleCropSave}>Recortar</Button>
        </div>
      </Modal>
    </div>
  );
}
