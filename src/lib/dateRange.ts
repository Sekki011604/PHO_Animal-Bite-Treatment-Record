export function getDateRangeLabel(startDate?: string | null, endDate?: string | null) {
  const start = startDate?.trim()
  const end = endDate?.trim()

  if (start && end) return `${start} to ${end}`
  if (start) return `From ${start}`
  if (end) return `Up to ${end}`
  return 'All Time'
}
