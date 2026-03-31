export const DATE_FILTER_OPTIONS = ['All Time', 'Today', 'Last 7 Days', 'This Month', 'This Year'] as const

export type DateFilterOption = (typeof DATE_FILTER_OPTIONS)[number]

export function getDateRange(filter: DateFilterOption): { start: string; end: string } | null {
  if (filter === 'All Time') return null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (filter === 'Today') {
    return { start: startOfToday.toISOString(), end: endOfToday.toISOString() }
  }

  if (filter === 'Last 7 Days') {
    const start = new Date(startOfToday)
    start.setDate(start.getDate() - 6)
    return { start: start.toISOString(), end: endOfToday.toISOString() }
  }

  if (filter === 'This Month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    return { start: start.toISOString(), end: endOfToday.toISOString() }
  }

  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  return { start: start.toISOString(), end: endOfToday.toISOString() }
}