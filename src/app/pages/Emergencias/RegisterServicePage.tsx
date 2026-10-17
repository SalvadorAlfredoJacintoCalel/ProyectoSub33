import { EmergenciaFormPage } from "./EmergenciaFormPage";

interface Props {
  onClose: () => void;
  currentUser?: string;
}

export function RegisterServicePage({ onClose }: Props) {
  return <EmergenciaFormPage mode="create" onClose={onClose} />;
}
