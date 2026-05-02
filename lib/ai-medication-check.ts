export type MedicationCheckActionState = {
  status: "idle" | "success" | "error";
  message: string;
  result?: {
    risk_level?: string;
    status?: string;
    summary?: string;
    advice?: string;
  };
};

export const initialMedicationCheckState: MedicationCheckActionState = {
  status: "idle",
  message: "",
};

export function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}