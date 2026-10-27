"use client";

import { Ban, CheckCircle, Pencil, Trash2 } from "lucide-react";

import { Modal } from "./modal";
import { Button } from "./button";
import { Badge } from "./badge";

export interface DetalleCampo {
  label: string;
  value: React.ReactNode;
}

export interface DetalleRegistroModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descripcion?: string;
  campos: DetalleCampo[];
  activo?: boolean;
  esAdmin?: boolean;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;
  loading?: boolean;
  onEditar?: () => void;
  onDesactivar?: () => void;
  onReactivar?: () => void;
  onEliminar?: () => void;
}

/**
 * Modal genérico de detalle de un registro. Se abre al hacer clic en el
 * nombre/responsable de cada fila de las tablas. Muestra los campos del
 * registro y, según permisos, las acciones de editar / desactivar /
 * reactivar / eliminar.
 */
export function DetalleRegistroModal({
  open,
  onClose,
  titulo,
  descripcion,
  campos,
  activo = true,
  esAdmin = false,
  puedeEditar = false,
  puedeEliminar = false,
  loading = false,
  onEditar,
  onDesactivar,
  onReactivar,
  onEliminar,
}: DetalleRegistroModalProps) {
  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {puedeEditar && onEditar && (
        <Button variant="outline" onClick={onEditar} disabled={loading}>
          <Pencil size={14} />
          Editar
        </Button>
      )}
      {activo ? (
        onDesactivar && (
          <Button variant="outline" onClick={onDesactivar} disabled={loading} loading={loading}>
            <Ban size={14} />
            Desactivar
          </Button>
        )
      ) : (
        esAdmin &&
        onReactivar && (
          <Button variant="outline" onClick={onReactivar} disabled={loading}>
            <CheckCircle size={14} />
            Reactivar
          </Button>
        )
      )}
      {esAdmin && puedeEliminar && onEliminar && (
        <Button variant="destructive" onClick={onEliminar} disabled={loading}>
          <Trash2 size={14} />
          Eliminar
        </Button>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} size="lg" title={titulo} description={descripcion} footer={footer}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Estado
          </span>
          <Badge variant={activo ? "success" : "error"} dot>
            {activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.label} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-hover)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                {campo.label}
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {campo.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default DetalleRegistroModal;
