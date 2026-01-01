/**
 * 금액 포맷팅 (1,234,567원)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

/**
 * 금액 포맷팅 (부호 포함, +1,234원 / -1,234원)
 */
export function formatCurrencyWithSign(amount: number): string {
  const formatted = new Intl.NumberFormat('ko-KR').format(Math.abs(amount))
  if (amount > 0) return `+${formatted}원`
  if (amount < 0) return `-${formatted}원`
  return `${formatted}원`
}

/**
 * 금액만 포맷팅 (원 없이, 1,234,567)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

/**
 * 입력 문자열 -> 숫자 (콤마, 원 등 제거)
 */
export function parseCurrency(input: string): number {
  return parseInt(input.replace(/[^0-9-]/g, ''), 10) || 0
}

/**
 * 실제 반영 금액 계산 (할인/공제 적용)
 */
export function getEffectiveAmount(amount: number, adjustment: number = 0): number {
  return amount - adjustment
}
