export const TEAM_LABELS = ['A', 'B', 'C'] as const

export function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function defaultMatchTitle(date: string) {
  return `Đá bóng ${formatMatchDate(date)}`
}
