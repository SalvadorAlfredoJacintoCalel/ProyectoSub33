import { EmergenciaFormPage } from "./EmergenciaFormPage";

interface Props {
  serviceId: number;
  onClose: () => void;
  onSaved?: () => void;
}

export function EditServicePage({ serviceId, onClose, onSaved }: Props) {
  return <EmergenciaFormPage mode="edit" serviceId={serviceId} onClose={onClose} onSaved={onSaved} />;
}
