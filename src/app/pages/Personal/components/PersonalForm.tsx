import { useState } from "react";
import type { Dispatch, SetStateAction, ElementType } from "react";
import { RefreshCw, KeyRound, Shield, ChevronDown, User, Award, Phone, AlertTriangle } from "lucide-react";
import type { FormState, RangoItem, RolItem } from "@/types/personal";
import { Modal } from "@/app/components/ui/modal";
import { Input } from "@/app/components/ui/input";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { Button } from "@/app/components/ui/button";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { CatalogAutocomplete } from "@/app/components/ui/CatalogAutocomplete";

interface FormProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  editingId: string | null;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
  credOpen: boolean;
  setCredOpen: Dispatch<SetStateAction<boolean>>;
  showPw: boolean;
  setShowPw: Dispatch<SetStateAction<boolean>>;
  hasAccess: boolean;
  rangos: RangoItem[];
  roles: RolItem[];
  saving: boolean;
  onSubmit: () => void;
  draftSavedAt: number | null;
  draftOnline: boolean;
  draft: FormState | null;
  onDraftDiscard: () => void;
}

function slugify(s: string): string {
  return s.toLowerCase().split("").filter((c) => /[a-z0-9\s]/.test(c)).join("").replace(/\s+/g, " ").trim();
}

function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CollapsibleSection({
  label,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  icon: ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
        style={{
          background: open ? "var(--glass-bg-subtle)" : "var(--bg-hover)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--grad-primary-soft)", color: "var(--brand-600)" }}
        >
          <Icon size={16} />
        </span>
        <span className="flex-1 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-1)" }}>
          {label}
        </span>
        <ChevronDown
          size={15}
          style={{
            color: "var(--text-3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{ paddingTop: 16, animation: "slide-up 200ms var(--spring-gentle) both" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { id: number; nombre: string }[];
  error?: string;
  placeholder: string;
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
        {label} <span style={{ color: "var(--brand-600)" }}>*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-1)",
          border: error ? "1px solid var(--brand-500)" : "1px solid var(--border)",
        }}
      >
        <option value={0}>{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  show,
  onToggle,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <PasswordField
      id={id}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      show={show}
      onToggle={onToggle}
      className="font-mono"
    />
  );
}

export function PersonalForm({
  open,
  onClose,
  onCancel,
  editingId,
  form,
  setForm,
  errors,
  setErrors,
  credOpen,
  setCredOpen,
  showPw,
  setShowPw,
  hasAccess,
  rangos,
  roles,
  saving,
  onSubmit,
  draftSavedAt,
  draftOnline,
  draft,
  onDraftDiscard,
}: FormProps) {
  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (!editingId && (field === "primerNombre" || field === "primerApellido")) {
        next.usuario = slugify(next.primerNombre + next.primerApellido);
      }
      return next;
    });
    if (errors[field as string] || field === "contrasena" || field === "confirmarContrasena") {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field as string];
        if (field === "contrasena" || field === "confirmarContrasena") {
          delete n.contrasena;
          delete n.confirmarContrasena;
        }
        return n;
      });
    }
  }

  function handleGeneratePassword() {
    const pw = generateRandomPassword();
    setForm((prev) => ({ ...prev, contrasena: pw, confirmarContrasena: pw }));
    setShowPw(true);
  }

  const passwordsMismatch =
    form.contrasena.length > 0 &&
    form.confirmarContrasena.length > 0 &&
    form.contrasena !== form.confirmarContrasena;

  const passwordRequired = !editingId || !hasAccess;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      variant="glass"
      title={editingId ? "Editar Miembro" : "Nuevo Miembro"}
      description={
        editingId
          ? "Actualiza la información del miembro de la compañía."
          : "Registra un nuevo miembro de la 33ª Compañía."
      }
      icon={<Shield className="size-6" />}
      className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
      footer={
        <>
          <Button variant="brand-outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="brand" loading={saving} onClick={onSubmit}>
            {editingId ? "Guardar Cambios" : "Registrar Miembro"}
          </Button>
        </>
      }
    >
      {/* Error summary */}
      <div className="mb-4">
        <DraftBanner draft={draft} online={draftOnline} onDiscard={onDraftDiscard} />
      </div>
      {Object.keys(errors).length > 0 && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl border p-3 text-sm"
          style={{
            borderColor: "var(--brand-300)",
            background: "var(--brand-100)",
            color: "var(--brand-700)",
          }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brand-600)" }} />
          <span>Por favor corrige los campos marcados antes de continuar.</span>
        </div>
      )}

      {/* ── Datos Personales ── */}
      <CollapsibleSection label="Datos Personales" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Primer Nombre *"
            placeholder="Ej. Carlos"
            value={form.primerNombre}
            onChange={(e) => setField("primerNombre", e.target.value)}
            error={errors.primerNombre}
          />
          <Input
            label="Segundo Nombre"
            placeholder="Ej. Humberto (opcional)"
            value={form.segundoNombre}
            onChange={(e) => setField("segundoNombre", e.target.value)}
          />
          <Input
            label="Primer Apellido *"
            placeholder="Ej. Tzintzún"
            value={form.primerApellido}
            onChange={(e) => setField("primerApellido", e.target.value)}
            error={errors.primerApellido}
          />
          <Input
            label="Segundo Apellido"
            placeholder="Ej. Ajú (opcional)"
            value={form.segundoApellido}
            onChange={(e) => setField("segundoApellido", e.target.value)}
          />
          <Input
            type="text"
            inputMode="numeric"
            maxLength={13}
            label="DPI *"
            placeholder="0000000000000"
            value={form.dpi}
            onChange={(e) => setField("dpi", e.target.value.replace(/\D/g, ""))}
            error={errors.dpi}
            className="font-mono"
          />
          <Input
            type="date"
            label="Fecha de Nacimiento"
            value={form.fechaNacimiento}
            onChange={(e) => setField("fechaNacimiento", e.target.value)}
          />
        </div>
      </CollapsibleSection>

      {/* ── Información de Bombero ── */}
      <CollapsibleSection label="Información de Bombero" icon={Award}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Código de Bombero *"
            placeholder="Ej. VOL-001"
            value={form.codigoBombero}
            onChange={(e) => setField("codigoBombero", e.target.value)}
            error={errors.codigoBombero}
          />
          <CatalogAutocomplete
            tipo="rangos"
            label="Rango"
            required
            value={form.rangoId ? String(form.rangoId) : ""}
            onChange={(id) => setField("rangoId", id ? Number(id) : 0)}
            items={rangos}
            error={errors.rangoId}
            placeholder="Seleccionar o crear rango..."
          />
          <Input
            type="text"
            label="Teléfono *"
            placeholder="+502 XXXX-XXXX"
            value={form.telefono}
            onChange={(e) => setField("telefono", e.target.value)}
            error={errors.telefono}
          />
        </div>
      </CollapsibleSection>

      {/* ── Contacto de Emergencia ── */}
      <CollapsibleSection label="Contacto de Emergencia" icon={Phone}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre del Contacto *"
            placeholder="Nombre completo"
            value={form.contactoEmergencia}
            onChange={(e) => setField("contactoEmergencia", e.target.value)}
            error={errors.contactoEmergencia}
          />
          <Input
            type="text"
            label="Teléfono de Emergencia *"
            placeholder="+502 XXXX-XXXX"
            value={form.telEmergencia}
            onChange={(e) => setField("telEmergencia", e.target.value)}
            error={errors.telEmergencia}
          />
        </div>
      </CollapsibleSection>

      {/* ── Acceso al Sistema ── */}
      <div style={{ marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setCredOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
          style={{
            background: credOpen ? "var(--glass-bg-subtle)" : "var(--bg-hover)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: credOpen ? "var(--grad-primary)" : "var(--grad-primary-soft)",
              color: credOpen ? "#FFFFFF" : "var(--brand-600)",
            }}
          >
            <KeyRound size={16} />
          </span>
          <span className="flex-1 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-1)" }}>
            Acceso al Sistema <span style={{ color: "var(--text-3)", textTransform: "none", fontWeight: 400 }}>(opcional)</span>
          </span>
          <ChevronDown
            size={15}
            style={{
              color: "var(--text-3)",
              transform: credOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              flexShrink: 0,
            }}
          />
        </button>

        {credOpen && (
          <div
            className="flex flex-col gap-4 rounded-xl p-4"
            style={{
              marginTop: 8,
              background: "var(--glass-bg-subtle)",
              border: "1px solid var(--glass-border)",
              animation: "slide-up 200ms var(--spring-gentle) both",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Usuario *"
                placeholder="cgarcia"
                value={form.usuario}
                onChange={(e) => setField("usuario", e.target.value.toLowerCase().replace(/\s/g, ""))}
                error={errors.usuario}
                className="font-mono"
              />
              <SelectField
                label="Rol del Sistema"
                value={form.rolId}
                onChange={(v) => setField("rolId", v)}
                options={roles}
                error={errors.rolId}
                placeholder="Seleccionar rol..."
              />
            </div>

            <Input
              type="email"
              label="Correo electrónico *"
              placeholder="correo@ejemplo.com"
              value={form.correo}
              onChange={(e) => setField("correo", e.target.value.trim())}
              error={errors.correo}
            />

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <PasswordInput
                  id="contrasena"
                  label={passwordRequired ? "Contraseña *" : "Contraseña"}
                  placeholder={passwordRequired ? "Mínimo 8 caracteres" : "Nueva contraseña (opcional)"}
                  value={form.contrasena}
                  onChange={(v) => setField("contrasena", v)}
                  error={errors.contrasena}
                  show={showPw}
                  onToggle={() => setShowPw((v) => !v)}
                />
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                title="Generar contraseña aleatoria"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors"
                style={{ borderColor: "var(--border)", background: "var(--bg-hover)", color: "var(--text-2)" }}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {(form.contrasena.length > 0 || passwordRequired) && (
              <PasswordInput
                id="confirmarContrasena"
                label={passwordRequired ? "Confirmar Contraseña *" : "Confirmar Contraseña"}
                placeholder="Repetir contraseña"
                value={form.confirmarContrasena}
                onChange={(v) => setField("confirmarContrasena", v)}
                error={errors.confirmarContrasena ?? (passwordsMismatch ? "Las contraseñas no coinciden" : undefined)}
                show={showPw}
                onToggle={() => setShowPw((v) => !v)}
              />
            )}

            <div
              className="flex items-start gap-2 rounded-lg p-3 text-xs"
              style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
            >
              <Shield size={13} style={{ marginTop: 2, flexShrink: 0, color: "var(--text-3)" }} />
              <span>
                {!editingId
                  ? "Al crear la cuenta, el bombero recibirá sus credenciales de acceso al sistema."
                  : hasAccess
                    ? "Deja la contraseña vacía si no deseas cambiarla. Solo los campos que modifiques serán actualizados."
                    : "Al otorgar acceso al sistema, se creará la cuenta con las credenciales indicadas."}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
