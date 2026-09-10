import { useState, useRef } from "react";
import { X, Eye, EyeOff } from "lucide-react";

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
    <div className="w-32 h-32 rounded-full bg-[#d4d4d8] flex items-center justify-center overflow-hidden shrink-0">
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        {/* Head */}
        <circle cx="40" cy="28" r="16" fill="#f4f4f5" />
        {/* Shoulders */}
        <ellipse cx="40" cy="74" rx="28" ry="22" fill="#f4f4f5" />
      </svg>
    </div>
  );
}

export function ProfilePage({ onClose, profileForm, setProfileForm }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-12 py-10 flex flex-col gap-8">

      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[36px] tracking-[-1.5px] text-[#1b1b1c] leading-tight">
            MI PERFIL DE BOMBERO
          </h1>
          <p className="font-['Inter:Regular',sans-serif] text-[16px] text-[#5f5e5e] mt-1">
            Información personal y credenciales institucionales
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors mt-2 shrink-0"
        >
          <X size={20} color="#71717a" />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[300px_1fr] gap-8 items-start pb-12">

        {/* ── LEFT — Avatar + Info Card ── */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {/* Avatar area — centered placeholder */}
          <div className="flex flex-col items-center justify-center pt-10 pb-6 px-5 bg-[#fafafa]" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <AvatarPlaceholder />
          </div>

          {/* Upload button */}
          <div className="px-5 pt-5 pb-1">
            <label className="cursor-pointer block">
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" />
              <div className="w-full py-3 rounded-lg bg-[#c11d1d] text-center font-['Inter:Bold',sans-serif] font-bold text-[14px] text-white hover:bg-[#a61818] transition-colors">
                Subir Nueva Foto
              </div>
            </label>
          </div>

          {/* Info rows */}
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#71717a]">Full Name</p>
              <p className="font-['Manrope:Bold',sans-serif] font-bold text-[15px] text-[#1b1b1c]">
                {profileForm.nombre} {profileForm.apellido}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#71717a]">Rango</p>
              <p className="font-['Manrope:Bold',sans-serif] font-bold text-[15px] text-[#1b1b1c]">Bombero Primero</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#71717a]">Compañía</p>
              <p className="font-['Manrope:Bold',sans-serif] font-bold text-[15px] text-[#1b1b1c]">33ª Compañía</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form Card ── */}
        <div
          className="bg-white rounded-2xl p-8 flex flex-col gap-6"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
        >

          {/* Editable fields */}
          <div className="flex flex-col gap-4">

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="font-['Inter:Regular',sans-serif] text-[13px] text-[#1b1b1c]">Nombre</label>
              <input
                type="text"
                value={profileForm.nombre}
                onChange={e => setProfileForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full bg-white border border-[#e4e4e7] rounded-lg px-4 py-3 text-[13px] text-[#1b1b1c] outline-none focus:border-[#c11d1d] transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            {/* Apellido */}
            <div className="flex flex-col gap-1.5">
              <label className="font-['Inter:Regular',sans-serif] text-[13px] text-[#1b1b1c]">Apellido</label>
              <input
                type="text"
                value={profileForm.apellido}
                onChange={e => setProfileForm(f => ({ ...f, apellido: e.target.value }))}
                className="w-full bg-white border border-[#e4e4e7] rounded-lg px-4 py-3 text-[13px] text-[#1b1b1c] outline-none focus:border-[#c11d1d] transition-colors"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            {/* Nueva Contraseña — with eye toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-['Inter:Regular',sans-serif] text-[13px] text-[#1b1b1c]">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={profileForm.password}
                  onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white border border-[#e4e4e7] rounded-lg px-4 py-3 text-[13px] text-[#1b1b1c] outline-none focus:border-[#c11d1d] transition-colors pr-12"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#71717a] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña — with eye toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-['Inter:Regular',sans-serif] text-[13px] text-[#1b1b1c]">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={profileForm.confirmPassword}
                  onChange={e => setProfileForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full bg-white border border-[#e4e4e7] rounded-lg px-4 py-3 text-[13px] text-[#1b1b1c] outline-none focus:border-[#c11d1d] transition-colors pr-12"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#71717a] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-lg bg-[#c11d1d] font-['Inter:Bold',sans-serif] font-bold text-[14px] text-white hover:bg-[#a61818] transition-colors mt-2"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
