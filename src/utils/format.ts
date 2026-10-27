export function formatDate(iso: string): string {
  if (!iso) return "—";
  const datePart = iso.split("T")[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}
