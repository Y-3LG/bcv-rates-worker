// El BCV usa formato venezolano: coma decimal. Tomamos el último separador
// (',' o '.') como decimal y descartamos el resto como separador de miles,
// por si algún día lo agregan (mismo criterio que parseAmount en la app Flutter).
export function parseVzlaNumber(raw: string): number {
  const cleaned = raw.trim();
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIdx = Math.max(lastComma, lastDot);
  if (decimalIdx === -1) return parseFloat(cleaned) || 0;

  const intPart = cleaned.slice(0, decimalIdx).replace(/[.,]/g, "");
  const decPart = cleaned.slice(decimalIdx + 1);
  return parseFloat(`${intPart}.${decPart}`) || 0;
}
