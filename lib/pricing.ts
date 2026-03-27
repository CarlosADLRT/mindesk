export const RATE_MATRIX: Record<string, Record<string, number>> = {
  virtual: { individual: 130000, pareja_familia: 250000 },
  domiciliario: { individual: 160000, pareja_familia: 280000 },
  presencial: { individual: 190000, pareja_familia: 310000 },
}

export const SURCHARGE_AMOUNT = 15000

export function calculateRate(
  modality: string,
  sessionType: string,
  applySurcharge: boolean
): number {
  const base = RATE_MATRIX[modality]?.[sessionType] ?? 0
  return applySurcharge ? base + SURCHARGE_AMOUNT : base
}
