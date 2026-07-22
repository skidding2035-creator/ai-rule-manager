export function formatNumber(value: number): string {
  return value.toLocaleString('ja-JP')
}

export function formatPercent(value: number): string {
  return `${value}%`
}
