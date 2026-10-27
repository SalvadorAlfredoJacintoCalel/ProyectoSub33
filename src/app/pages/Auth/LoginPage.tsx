import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  Eye, EyeOff, User, Lock, LogIn,
  Shield, Flame, Heart, Handshake,
  Mail, ArrowLeft, RotateCcw, KeyRound,
} from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import imgCrossBadge from "@/imports/DashboardPrincipalDesktop/39b842ab5db9edc3f36b77dcb333e6063de137a7.png";
import imgCvbLogo from "@/imports/DashboardPrincipalDesktop/382ba90f17ab58630c2735b72b71bff037f7ba87.png";
import { useAlert } from "@/app/components/ui/AlertSystem";
import {
  login as authLogin,
  solicitarRecuperacion,
  verificarOtp,
  restablecerContrasena,
} from "@/services/authService";
import type { UserRole } from "@/constants/roles";

// ─── constants ────────────────────────────────────────────────────────────────

const HERO_BG =
  "https://images.unsplash.com/photo-1614338577197-5812cb856df7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const VALUES = [];

type Step = "login" | "forgot" | "verify" | "reset" | "success";

// ─── sub-components ───────────────────────────────────────────────────────────


function IconInput({
  icon,
  rightSlot,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <div
      className="flex items-center rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #d4d4d8" }}
    >
      <div
        className="flex items-center justify-center px-4 py-[14px] shrink-0"
        style={{ borderRight: "1px solid #d4d4d8", background: "#f4f4f5" }}
      >
        {icon}
      </div>
      <input
        {...props}
        className="flex-1 px-4 py-[14px] text-[14px] text-[#1b1b1c] outline-none bg-white placeholder:text-[var(--text-3)]"
        style={{ fontFamily: "Inter, sans-serif" }}
      />
      {rightSlot}
    </div>
  );
}

function RedButton({
  icon,
  label,
  onClick,
  type = "submit",
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[#c11d1d] hover:bg-[#a61818] active:bg-[#8b0009] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ boxShadow: "0 4px 16px rgba(193,29,29,0.35)" }}
    >
      {icon}
      <span
        className="font-extrabold text-[14px] tracking-[1.5px] sm:tracking-[2.5px] text-white uppercase"
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        {label}
      </span>
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 w-full font-bold text-[13px] text-[#71717a] hover:text-[#3f3f46] transition-colors mt-1"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <ArrowLeft size={14} />
      Volver al inicio de sesión
    </button>
  );
}

// ─── left hero (shared across all steps) ──────────────────────────────────────

function LeftHero() {
  return (
    <div className="hidden lg:flex flex-1 relative flex-col overflow-hidden min-w-0">
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt="Bomberos Voluntarios 33ª Compañía San Lucas Tolimán"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-[#4a0000]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0000]/80 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pt-14 pb-4">
        <div className="w-14 h-[3px] bg-[#c11d1d] rounded-full mb-5" />
        <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[clamp(20px,2.4vw,28px)] text-[#f5c500] tracking-[1px] lg:tracking-[2px] uppercase leading-8 text-balance">
          SIEMPRE AL SERVICIO<br />
          DE NUESTRA COMUNIDAD
        </p>
      </div>

      <div className="relative z-10">
        <svg viewBox="0 0 600 52" preserveAspectRatio="none" className="w-full block h-8 lg:h-[52px]" style={{ marginBottom: -1 }}>
          <path d="M0,52 L0,38 Q100,4 250,28 Q380,48 600,8 L600,52 Z" fill="#7a0000" />
        </svg>
        {/* Company name above seals */}
        <div className="bg-[#7a0000] text-center pt-3 pb-1">
          <p className="font-bold text-[13px] tracking-[1.8px] text-white/90 uppercase" style={{ fontFamily: "Manrope, sans-serif" }}>
            Sub 33 COMPAÑÍA BOMBEROS VOLUNTARIOS
          </p>
          <p className="font-bold text-[10px] tracking-[1.4px] text-white/55 uppercase mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            SAN LUCAS TOLIMÁN, SOLOLÁ
          </p>
        </div>
        <div className="bg-[#7a0000] flex items-center justify-center gap-8 px-10 pt-2 pb-3">
          <div className="w-16 lg:w-24 h-16 lg:h-24 shrink-0">
            <ImageWithFallback src={imgCvbLogo} alt="Benemérito Cuerpo Voluntario de Bomberos Guatemala" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="w-16 lg:w-24 h-16 lg:h-24 shrink-0">
            <ImageWithFallback src={imgCrossBadge} alt="Insignia 33ª Compañía de Bomberos Voluntarios San Lucas Tolimán" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
        </div>
        <div className="bg-[#110000] flex items-center justify-around px-8 py-4">
          {VALUES.map((item, i) => (
            <div key={item.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 text-white/80 px-4">
                {item.icon}
                <span className="font-bold text-[9px] tracking-[1.8px] uppercase" style={{ fontFamily: "Inter, sans-serif" }}>
                  {item.label}
                </span>
              </div>
              {i < VALUES.length - 1 && <div className="w-px h-8 bg-white/15" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── right panel chrome (decorations shared across all steps) ─────────────────

function RightPanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden w-full bg-[linear-gradient(160deg,var(--navy),#7a0000)] lg:bg-[#f0efed] lg:bg-none lg:w-[clamp(380px,42%,520px)]"
    >
      {/* Flag corner */}
      <div className="hidden lg:block absolute top-0 right-0 pointer-events-none overflow-hidden" style={{ width: 160, height: 160 }}>
        <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
          <polygon points="160,0 160,160 0,0" fill="#1b2e4b" />
          <polygon points="160,0 160,52 68,0" fill="#e8b800" />
          <polygon points="160,56 160,84 96,0 72,0" fill="white" opacity="0.88" />
          <polygon points="160,88 160,116 124,0 98,0" fill="#1565c0" opacity="0.8" />
        </svg>
      </div>

      {/* Mountain watermark */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none" style={{ opacity: 0.055 }}>
        <svg viewBox="0 0 520 140" fill="none" className="w-full">
          <path d="M-20,140 L70,55 L130,90 L210,18 L290,72 L360,32 L440,78 L490,40 L540,60 L540,140 Z" fill="#1b1b1c" />
          <path d="M-20,140 L50,95 L90,118 L170,52 L240,96 L310,28 L395,65 L475,42 L540,68 L540,140 Z" fill="#1b1b1c" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-10 max-w-[420px]">
        <div className="lg:hidden text-center pt-8 pb-4">
          <div className="w-12 h-12 mx-auto mb-3">
            <ImageWithFallback
              src={imgCrossBadge}
              alt="Insignia 33ª Compañía de Bomberos Voluntarios San Lucas Tolimán"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <p className="font-bold text-[13px] tracking-[1.5px] text-white uppercase" style={{ fontFamily: "Manrope, sans-serif" }}>
            Sub 33ª COMPAÑÍA BOMBEROS VOLUNTARIOS
          </p>
          <p className="font-bold text-[10px] tracking-[1.4px] uppercase mt-1" style={{ fontFamily: "Inter, sans-serif", color: "#f5c500" }}>
            SIEMPRE AL SERVICIO DE NUESTRA COMUNIDAD
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-2xl p-5 sm:p-6 mb-8 lg:bg-transparent lg:rounded-none lg:shadow-none lg:p-0 lg:mb-0">
          {children}
        </div>

        <div className="lg:hidden text-center pb-8 pt-4">
          <p className="font-bold text-[10px] tracking-[2px] uppercase text-white/55" style={{ fontFamily: "Inter, sans-serif" }}>
            SAN LUCAS TOLIMÁN · SOLOLÁ
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── step panels ──────────────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#fff1f0] mx-auto mb-4">
        <KeyRound size={24} color="#c11d1d" strokeWidth={2} />
      </div>
      <h2
        className="font-extrabold text-[22px] text-[#1b2e4b] tracking-[-0.3px] leading-tight text-balance"
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        {title}
      </h2>
      <p className="text-[13px] text-[#71717a] mt-2 leading-5" style={{ fontFamily: "Inter, sans-serif" }}>
        {subtitle}
      </p>
    </div>
  );
}

// Step 1 — Request code
function ForgotStep({
  username,
  email,
  onUsernameChange,
  onEmailChange,
  onSend,
  onBack,
  sending,
}: {
  username: string;
  email: string;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
  sending: boolean;
}) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSend(); }} className="flex flex-col gap-4">
      <StepHeader
        title="RECUPERAR CONTRASEÑA"
        subtitle="Ingresa tu usuario y correo para recibir un código de verificación."
      />
      <IconInput
        icon={<User size={18} color="#71717a" />}
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={e => onUsernameChange(e.target.value)}
      />
      <IconInput
        icon={<Mail size={18} color="#71717a" />}
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
      />
      <RedButton icon={<Mail size={18} color="white" strokeWidth={2.5} />} label={sending ? "ENVIANDO..." : "ENVIAR CÓDIGO"} disabled={sending} />
      <BackLink onClick={onBack} />
    </form>
  );
}

// Step 2 — OTP verify
function VerifyStep({ onVerify, onBack, onResend, verifying, resending }: { onVerify: (codigo: string) => void; onBack: () => void; onResend: () => void; verifying: boolean; resending: boolean }) {
  const [otp, setOtp] = useState(Array<string>(6).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    e.preventDefault();
    const next = [...otp];
    digits.forEach((d, idx) => { if (idx < 6) next[idx] = d; });
    setOtp(next);
    const focus = Math.min(digits.length, 5);
    refs.current[focus]?.focus();
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onVerify(otp.join("")); }} className="flex flex-col gap-5">
      <StepHeader
        title="VERIFICAR CÓDIGO"
        subtitle="Ingresa el código de 6 dígitos enviado a tu correo."
      />

      {/* OTP boxes */}
      <div className="flex gap-1.5 sm:gap-2.5 justify-center" onPaste={handlePaste}>
        {otp.map((val, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="w-10 sm:w-12 h-14 text-center text-[20px] font-bold text-[#1b1b1c] bg-white rounded-xl outline-none transition-all"
            style={{
              border: val ? "2px solid #c11d1d" : "1.5px solid #d4d4d8",
              fontFamily: "Manrope, sans-serif",
              boxShadow: val ? "0 0 0 3px rgba(193,29,29,0.08)" : "none",
            }}
          />
        ))}
      </div>

      <RedButton icon={<KeyRound size={18} color="white" strokeWidth={2.5} />} label={verifying ? "VERIFICANDO..." : "VERIFICAR CÓDIGO"} disabled={verifying} />

      {/* Resend */}
      <div className="text-center">
        <span className="text-[13px] text-[#71717a]" style={{ fontFamily: "Inter, sans-serif" }}>
          ¿No recibiste el código?{" "}
        </span>
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="font-bold text-[13px] text-[#c11d1d] hover:text-[#a61818] inline-flex items-center gap-1 transition-colors disabled:opacity-60"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <RotateCcw size={12} />
          {resending ? "Reenviando..." : "Reenviar"}
        </button>
      </div>

      <BackLink onClick={onBack} />
    </form>
  );
}

// Step 3 — New password
function ResetStep({ onReset, onBack, resetting }: { onReset: (nueva: string) => void; onBack: () => void; resetting: boolean }) {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="px-4 py-[14px] text-[#a1a1aa] hover:text-[#71717a] transition-colors shrink-0"
        tabIndex={-1}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    );
  }

  const mismatch = newPwd !== confirmPwd;

  return (
    <form onSubmit={e => { e.preventDefault(); if (!mismatch && newPwd) onReset(newPwd); }} className="flex flex-col gap-4">
      <StepHeader
        title="NUEVA CONTRASEÑA"
        subtitle="Crea una nueva contraseña para tu cuenta."
      />

      <IconInput
        icon={<Lock size={18} color="#71717a" />}
        type={showNew ? "text" : "password"}
        placeholder="Nueva Contraseña"
        value={newPwd}
        onChange={e => setNewPwd(e.target.value)}
        rightSlot={<EyeBtn show={showNew} toggle={() => setShowNew(v => !v)} />}
      />

      <IconInput
        icon={<Lock size={18} color="#71717a" />}
        type={showConfirm ? "text" : "password"}
        placeholder="Confirmar Nueva Contraseña"
        value={confirmPwd}
        onChange={e => setConfirmPwd(e.target.value)}
        rightSlot={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(v => !v)} />}
      />

      {mismatch && (
        <p className="text-[12px] text-[#c11d1d]" style={{ fontFamily: "Inter, sans-serif" }}>
          Las contraseñas no coinciden.
        </p>
      )}

      <RedButton icon={<KeyRound size={18} color="white" strokeWidth={2.5} />} label={resetting ? "CAMBIANDO..." : "CAMBIAR CONTRASEÑA"} disabled={resetting || mismatch || !newPwd} />
      <BackLink onClick={onBack} />
    </form>
  );
}

// Step 4 — Success
function SuccessStep({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Green checkmark badge */}
      <div
        className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full"
        style={{ background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", boxShadow: "0 0 0 8px rgba(34,197,94,0.1)" }}
      >
        <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
          <circle cx={20} cy={20} r={20} fill="#16a34a" />
          <path d="M11 20.5L17.5 27L29 13" stroke="white" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2
          className="font-extrabold text-[22px] text-[#15803d] tracking-[-0.3px] text-balance"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          ¡CONTRASEÑA ACTUALIZADA!
        </h2>
        <p
          className="text-[13px] text-[#71717a] leading-6 max-w-full sm:max-w-[300px]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.
        </p>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#e4e4e7]" />

      <RedButton
        type="button"
        icon={<LogIn size={18} color="white" strokeWidth={2.5} />}
        label="IR AL INICIO DE SESIÓN"
        onClick={onLogin}
      />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type LoginUser = {
  username: string;
  role: UserRole;
  name: string;
  roles?: string[];
  permisos?: string[];
};

type Props = { onLogin: (token: string, user: LoginUser) => void };

export function LoginPage({ onLogin }: Props) {
  const { toast } = useAlert();
  const [step, setStep] = useState<Step>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recovUser, setRecovUser] = useState("");
  const [recovEmail, setRecovEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await authLogin(username, password, rememberMe);
    setSubmitting(false);

    if (result.success) {
      onLogin(result.token, result.user);
    } else {
      toast.error("Credenciales incorrectas, por favor verifique su información");
    }
  }

  async function handleForgot() {
    if (!recovUser.trim() || !recovEmail.trim()) {
      toast.error("Ingresa tu usuario y correo electrónico.");
      return;
    }
    setSending(true);
    const result = await solicitarRecuperacion(recovUser.trim(), recovEmail.trim());
    setSending(false);
    if (result.success) {
      toast.success("Código enviado correctamente, verifique su correo.");
      setStep("verify");
    } else {
      toast.error("Información incorrecta, verifique sus datos.");
    }
  }

  async function handleResend() {
    setResending(true);
    const result = await solicitarRecuperacion(recovUser.trim(), recovEmail.trim());
    setResending(false);
    if (result.success) {
      toast.success("Código enviado correctamente, verifique su correo.");
    } else {
      toast.error("Información incorrecta, verifique sus datos.");
    }
  }

  async function handleVerify(codigo: string) {
    setVerifying(true);
    const result = await verificarOtp(recovUser.trim(), recovEmail.trim(), codigo);
    setVerifying(false);
    if (result.success && result.resetToken) {
      setResetToken(result.resetToken);
      setStep("reset");
    } else {
      toast.error(result.error || "Código inválido o expirado.");
    }
  }

  async function handleReset(nueva: string) {
    setResetting(true);
    const result = await restablecerContrasena(resetToken, nueva);
    setResetting(false);
    if (result.success) {
      toast.success("Contraseña actualizada correctamente.");
      setStep("success");
    } else {
      toast.error(result.error || "No se pudo restablecer la contraseña.");
    }
  }

  return (
    <div className="min-h-screen w-full flex overflow-x-hidden">
      <LeftHero />

      <RightPanel>
        {step === "login" && (
          <>
            {/* Motto header */}
            <div className="text-center mb-5">
              <h2 className="leading-tight text-balance">
                <span className="block font-extrabold text-[clamp(22px,2.8vw,30px)] text-[#c11d1d] tracking-[-0.2px] lg:tracking-[-0.5px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  DISCIPLINA,
                </span>
                <span className="block font-extrabold text-[clamp(22px,2.8vw,30px)] text-[#1b2e4b] tracking-[-0.2px] lg:tracking-[-0.5px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  HONOR Y ABNEGACIÓN
                </span>
              </h2>
            </div>

            {/* Flame divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#c8c8cc]" />
              <Flame size={20} color="#c11d1d" strokeWidth={1.75} />
              <div className="flex-1 h-px bg-[#c8c8cc]" />
            </div>

            {/* Welcome */}
            <div className="text-center mb-6">
              <h3 className="font-extrabold text-[20px] text-[#1b1b1c] tracking-[0.5px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                BIENVENIDO
              </h3>
              <p className="text-[14px] text-[#71717a] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Inicia sesión para continuar
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <IconInput
                icon={<User size={18} color="#71717a" />}
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />

              <IconInput
                icon={<Lock size={18} color="#71717a" />}
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="px-4 py-[14px] text-[#a1a1aa] hover:text-[#71717a] transition-colors shrink-0"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Options */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#c11d1d" }}
                  />
                  <span className="text-[13px] text-[#3f3f46]" style={{ fontFamily: "Inter, sans-serif" }}>
                    Recordar sesión
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setStep("forgot")}
                  className="font-bold text-[13px] text-[#c11d1d] hover:text-[#a61818] transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <RedButton icon={<LogIn size={19} color="white" strokeWidth={2.5} />} label={submitting ? "INICIANDO SESIÓN..." : "INICIAR SESIÓN"} disabled={submitting} />
            </form>
          </>
        )}

        {step === "forgot" && (
          <ForgotStep
            username={recovUser}
            email={recovEmail}
            onUsernameChange={setRecovUser}
            onEmailChange={setRecovEmail}
            sending={sending}
            onSend={handleForgot}
            onBack={() => setStep("login")}
          />
        )}

        {step === "verify" && (
          <VerifyStep
            verifying={verifying}
            resending={resending}
            onVerify={handleVerify}
            onResend={handleResend}
            onBack={() => setStep("forgot")}
          />
        )}

        {step === "reset" && (
          <ResetStep
            resetting={resetting}
            onReset={handleReset}
            onBack={() => setStep("verify")}
          />
        )}

        {step === "success" && (
          <SuccessStep onLogin={() => setStep("login")} />
        )}
      </RightPanel>
    </div>
  );
}
