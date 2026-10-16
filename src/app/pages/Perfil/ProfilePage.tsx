import { useState, useRef } from "react";
import { X, Eye, EyeOff, Bell, Shield, Settings, User, Smartphone } from "lucide-react";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { EmptyState } from "@/app/components/ui/empty-state";

type ProfileFormState = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Props = {
  onClose: () => void;
  profileForm: ProfileFormState;
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileFormState>>;
};

function AvatarPlaceholder() {
  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "var(--grad-primary-soft)" }}>
      <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
        <circle cx="40" cy="28" r="16" fill="var(--brand-200)" />
        <ellipse cx="40" cy="74" rx="28" ry="22" fill="var(--brand-200)" />
      </svg>
    </div>
  );
}

export function ProfilePage({ onClose, profileForm, setProfileForm }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  const tabs: TabItem[] = [
    {
      id: "perfil",
      label: "Perfil",
      icon: <User size={15} />,
      content: (
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={profileForm.nombre}
            onChange={(e) => setProfileForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            label="Apellido"
            value={profileForm.apellido}
            onChange={(e) => setProfileForm((f) => ({ ...f, apellido: e.target.value }))}
          />
          <Input
            type="email"
            label="Correo Electrónico"
            value={profileForm.email}
            onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      ),
    },
    {
      id: "seguridad",
      label: "Seguridad",
      icon: <Shield size={15} />,
      content: (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Nueva Contraseña"
              placeholder="••••••"
              value={profileForm.password}
              onChange={(e) => setProfileForm((f) => ({ ...f, password: e.target.value }))}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-3)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              label="Confirmar Contraseña"
              placeholder="••••••"
              value={profileForm.confirmPassword}
              onChange={(e) => setProfileForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-3)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button variant="outline" onClick={() => setShow2FA(true)}>
            <Smartphone className="size-4" /> Configurar verificación en 2 pasos
          </Button>
        </div>
      ),
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: <Bell size={15} />,
      content: (
        <EmptyState
          icon={Bell}
          title="Notificaciones"
          description="Configura las preferencias de notificación de tu cuenta."
        />
      ),
    },
    {
      id: "preferencias",
      label: "Preferencias",
      icon: <Settings size={15} />,
      content: (
        <EmptyState
          icon={Settings}
          title="Preferencias"
          description="Personaliza la apariencia y el idioma de tu cuenta."
        />
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-12 py-10 animate-page-enter">
      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-['Manrope:ExtraBold',sans-serif] text-[36px] font-extrabold leading-tight tracking-[-1.5px]" style={{ color: "var(--text-1)" }}>
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

      {/* Two-column layout */}
      <div className="grid grid-cols-[300px_1fr] items-start gap-8 pb-12">
        {/* ── LEFT — Avatar + Info Card ── */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex flex-col items-center justify-center px-5 pb-6 pt-10" style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--divider)" }}>
            <AvatarPlaceholder />
          </div>
          <div className="px-5 pb-1 pt-5">
            <label className="block cursor-pointer">
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" />
              <Button variant="brand" className="w-full" onClick={(e) => e.preventDefault()}>
                Subir Nueva Foto
              </Button>
            </label>
          </div>
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Nombre Completo</p>
              <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>
                {profileForm.nombre} {profileForm.apellido}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Rango</p>
              <Badge variant="brand">Bombero Primero</Badge>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Compañía</p>
              <p className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>33ª Compañía</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Tabs ── */}
        <div className="flex flex-col gap-6 rounded-2xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <Tabs variant="glass" tabs={tabs} />
          <Button variant="brand" onClick={onClose} className="w-full">
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        open={show2FA}
        onClose={() => setShow2FA(false)}
        size="sm"
        variant="glass"
        title="Verificación en 2 pasos"
        description="Escanea el código QR con tu aplicación de autenticación."
        icon={<Smartphone className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={<Button variant="brand" onClick={() => setShow2FA(false)}>Entendido</Button>}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-44 w-44 items-center justify-center rounded-2xl" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 36 }).map((_, i) => (
                <span key={i} className="h-3 w-3 rounded-[2px]" style={{ background: (i * 7) % 5 < 3 ? "var(--text-1)" : "transparent" }} />
              ))}
            </div>
          </div>
          <p className="text-center text-xs" style={{ color: "var(--text-3)" }}>
            Usa Google Authenticator o Authy para escanear el código y generar tu código de acceso.
          </p>
        </div>
      </Modal>
    </div>
  );
}
