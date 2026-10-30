import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { listarModulos, asignarModulos, type ModuloPermiso } from "@/services/seguridadService";

interface PermissionModalProps {
  rolId: number;
  rolNombre: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function PermissionModal({ rolId, rolNombre, onClose, onSaved }: PermissionModalProps) {
  const { toast } = useAlert();
  const [modulos, setModulos] = useState<ModuloPermiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    listarModulos(rolId)
      .then((data) => {
        if (mounted) setModulos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setModulos([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [rolId]);

  function toggle(moduloId: number) {
    setModulos((prev) =>
      prev.map((m) => (m.moduloId === moduloId ? { ...m, asignado: !m.asignado } : m))
    );
  }

  async function handleSave() {
    const ids = modulos.filter((m) => m.asignado).map((m) => m.moduloId);
    setSaving(true);
    try {
      await asignarModulos(rolId, ids);
      toast.success("Módulos asignados correctamente");
      onSaved?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar módulos";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      variant="glass"
      title="Módulos del Rol"
      description={`Asigna los módulos a los que tendrá acceso el rol «${rolNombre}».`}
      icon={<ShieldCheck className="size-6" />}
      className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
      footer={
        <>
          <Button variant="brand-outline" onClick={onClose}>Cancelar</Button>
          <Button variant="brand" loading={saving} onClick={handleSave}>Guardar</Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin" style={{ color: "var(--brand-600)" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modulos.map((m) => (
            <label
              key={m.moduloId}
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
              style={{
                borderColor: m.asignado ? "var(--brand-500)" : "var(--border)",
                background: m.asignado ? "var(--brand-50)" : "var(--bg-input)",
              }}
            >
              <input
                type="checkbox"
                checked={m.asignado}
                onChange={() => toggle(m.moduloId)}
                className="h-4 w-4 shrink-0"
                style={{ accentColor: "var(--brand-600)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{m.nombre}</p>
                {m.descripcion && (
                  <p className="truncate text-xs" style={{ color: "var(--text-3)" }}>{m.descripcion}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
