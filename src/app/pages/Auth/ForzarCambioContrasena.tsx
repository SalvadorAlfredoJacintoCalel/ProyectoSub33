import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { useAlert } from "@/app/components/ui/AlertContext";
import { cambiarContrasena, enviarCodigo2fa } from "@/services/authService";

export function ForzarCambioContrasena({ onCompletado }: { onCompletado: () => void }) {
  const { toast } = useAlert();
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function handleEnviar() {
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

  async function handleCambiar() {
    if (nueva.length < 8) {
      toast.warning("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (!codigo.trim()) {
      toast.warning("Ingresa el código de verificación enviado a tu correo.");
      return;
    }
    setGuardando(true);
    const result = await cambiarContrasena(nueva, codigo.trim());
    setGuardando(false);
    if (result.success) {
      toast.success("Contraseña cambiada. Inicia sesión con tu nueva contraseña.");
      onCompletado();
    } else {
      toast.error(result.error || "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: "var(--bg-page)" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4" style={{ background: "var(--red-bg)" }}>
            <ShieldAlert size={26} color="#c11d1d" />
          </div>
          <h2 className="font-extrabold text-[22px]" style={{ color: "var(--text-1)", fontFamily: "Manrope, sans-serif" }}>
            Cambio de contraseña obligatorio
          </h2>
          <p className="text-[13px] mt-2" style={{ color: "var(--text-2)" }}>
            Por seguridad, debes cambiar tu contraseña temporal antes de usar el sistema.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <PasswordField
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            placeholder="Repetir contraseña"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />

          <Button variant="outline" onClick={handleEnviar} disabled={enviando}>
            <KeyRound size={14} /> {enviando ? "Enviando..." : "Enviar código"}
          </Button>

          {codigoEnviado && (
            <>
              <Input
                label="Código de verificación"
                placeholder="6 dígitos"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              />
              <Button variant="brand" onClick={handleCambiar} disabled={guardando}>
                {guardando ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
