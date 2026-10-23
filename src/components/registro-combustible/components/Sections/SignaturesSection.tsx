import { useState } from "react";
import { SignaturePad } from "../SignaturePad";
import type { RegistroHeader } from "../../utils/calculations";

type FirmaKey = "elaboradoPor" | "jefeAbastecimientos" | "jefe33Cia" | "director";

const CARGOS: { id: FirmaKey; cargo: string }[] = [
  { id: "elaboradoPor", cargo: "ELABORADO POR" },
  { id: "jefeAbastecimientos", cargo: "JEFATURA DE ABASTECIMIENTOS Y SUMINISTROS" },
  { id: "jefe33Cia", cargo: "JEFE 33 CIA" },
  { id: "director", cargo: "DIRECTOR 33 CIA" },
];

interface SignaturesSectionProps {
  header: RegistroHeader;
  onNameChange: (key: keyof RegistroHeader, value: string) => void;
  initialFirmas?: Partial<Record<FirmaKey, string | null>>;
}

export function SignaturesSection({ header, onNameChange, initialFirmas }: SignaturesSectionProps) {
  const [firmas, setFirmas] = useState<Partial<Record<FirmaKey, string | null>>>(
    initialFirmas ?? {}
  );

  return (
    <div className="signatures-section">
      {CARGOS.map(({ id, cargo }) => (
        <div key={id} className="rc-signature">
          <div className="rc-signature-pad no-print">
            <SignaturePad
              value={firmas[id]}
              height={44}
              onChange={(b64) => setFirmas((prev) => ({ ...prev, [id]: b64 }))}
            />
          </div>
          {firmas[id] ? (
            <img className="rc-signature-img" src={firmas[id] ?? ""} alt={`Firma ${cargo}`} />
          ) : null}
          <div className="rc-signature-line" />
          <p className="rc-signature-cargo">{cargo}</p>
          <input
            className="rc-signature-name no-print"
            value={header[id]}
            onChange={(e) => onNameChange(id, e.target.value)}
            placeholder="Nombre"
          />
          <p className="rc-signature-name-print">{header[id]}</p>
        </div>
      ))}
    </div>
  );
}
