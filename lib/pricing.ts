export type RateMatrix = Record<string, Record<string, number>>

export interface WorkspacePricing {
  rate_matrix: RateMatrix
  surcharge_amount: number
}

export const DEFAULT_RATE_MATRIX: RateMatrix = {
  virtual: { individual: 130000, pareja_familia: 250000 },
  domiciliario: { individual: 160000, pareja_familia: 280000 },
  presencial: { individual: 190000, pareja_familia: 310000 },
}

export const DEFAULT_SURCHARGE_AMOUNT = 15000

export const DEFAULT_PRICING: WorkspacePricing = {
  rate_matrix: DEFAULT_RATE_MATRIX,
  surcharge_amount: DEFAULT_SURCHARGE_AMOUNT,
}

export function calculateRate(
  modality: string,
  sessionType: string,
  applySurcharge: boolean,
  pricing?: WorkspacePricing
): number {
  const { rate_matrix, surcharge_amount } = pricing ?? DEFAULT_PRICING
  const base = rate_matrix[modality]?.[sessionType] ?? 0
  return applySurcharge ? base + surcharge_amount : base
}
