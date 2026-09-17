import fs from 'fs';

const path = 'src/app/SeguridadPage.tsx';
const content = fs.readFileSync(path, 'utf8');

const oldCode = `function AccordionSection({
  categoria,
  items,
  onAdd,
  onDelete,
  onEdit,
  onDeleteCategoria,
  nuevaOpcion,
  setNuevaOpcion,
  isOpen,
  onOpenChange,
  deleteCategoryConfirm,
  onDeleteCategoriaConfirm,
  onCancelDeleteCategoria,
  isMobile,
  showToast,
  cargarListas,
  setListasMaestras: React.Dispatch<React.SetStateAction<ListasResponse[]>>;
}: {
  categoria: string;
  items: ListasResponse[];
  onAdd: (opcion: string) => void;
  onDelete: (item: ListasResponse) => void;
  onEdit: (item: ListasResponse) => void;
  onDeleteCategoria: (categoria: string) => void;
  nuevaOpcion: string;
  setNuevaOpcion: (val: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteCategoryConfirm: string | null;
  onDeleteCategoriaConfirm: () => void;
  onCancelDeleteCategoria: () => void;
  isMobile: boolean;
  showToast: (message: string, type: "success" | "error") => void;
  cargarListas: () => Promise<void>;
  setListasMaestras: React.Dispatch<React.SetStateAction<ListasResponse[]>>;
}) {`;

const newCode = `interface AccordionSectionProps {
  categoria: string;
  items: ListasResponse[];
  onAdd: (opcion: string) => void;
  onDelete: (item: ListasResponse) => void;
  onEdit: (item: ListasResponse) => void;
  onDeleteCategoria: (categoria: string) => void;
  nuevaOpcion: string;
  setNuevaOpcion: (val: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteCategoryConfirm: string | null;
  onDeleteCategoriaConfirm: () => void;
  onCancelDeleteCategoria: () => void;
  isMobile: boolean;
  showToast: (message: string, type: "success" | "error") => void;
  cargarListas: () => Promise<void>;
  setListasMaestras: React.Dispatch<React.SetStateAction<ListasResponse[]>>;
}

function AccordionSection({
  categoria,
  items,
  onAdd,
  onDelete,
  onEdit,
  onDeleteCategoria,
  nuevaOpcion,
  setNuevaOpcion,
  isOpen,
  onOpenChange,
  deleteCategoryConfirm,
  onDeleteCategoriaConfirm,
  onCancelDeleteCategoria,
  isMobile,
  showToast,
  cargarListas,
  setListasMaestras,
}: AccordionSectionProps) {`;

const newContent = content.replace(oldCode, newCode);
fs.writeFileSync('src/app/SeguridadPage.tsx', newContent);
console.log('File updated successfully');