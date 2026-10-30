import { EmergenciaFormPage } from "./EmergenciaFormPage";

interface Props {
  onClose: () => void;
  onSaved?: () => void;
  currentUser?: string;
}

export function RegisterServicePage({ onClose, onSaved }: Props) {
  return <EmergenciaFormPage mode="create" onClose={onClose} onSaved={onSaved} />;
}
