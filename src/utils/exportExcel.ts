import type { Worksheet } from 'exceljs'
import { AnimalBiteRecord } from '../types'

type QuarterNumber = 1 | 2 | 3 | 4

type PhoReportRow = {
  location: string
  caseCount: number
  totalPopulation: number
  male: number
  female: number
  under15: number
  over15: number
  categoryI: number
  categoryIIPrimary: number
  categoryIIBooster: number
  categoryIINonEligible: number
  categoryIIIPrimary: number
  categoryIIIBooster: number
  categoryIIINonEligible: number
  pepCompletedCategoryIIPrimary: number
  pepCompletedCategoryIIBooster: number
  pepCompletedCategoryIIIErig: number
  pepCompletedCategoryIIIHrig: number
  pepCompletedCategoryIIIBooster: number
  dog: number
  cat: number
  others: number
  petDomestic: number
  strayFreeRoaming: number
  unknownOwnership: number
  humanRabiesCases: number
}

const QUARTER_SHEET_NAMES: Record<QuarterNumber, string> = {
  1: 'Quarter 1',
  2: 'Quarter 2',
  3: 'Quarter 3',
  4: 'Quarter 4',
}

const SUMMARY_SHEET_NAME = 'Summary'
const DETAIL_START_ROW = 16
const DETAIL_END_ROW = 35
const TOTAL_ROW = 36
const MAX_DETAIL_ROWS = DETAIL_END_ROW - DETAIL_START_ROW + 1

const INPUT_NUMERIC_COLUMNS = ['B', 'C', 'D', 'F', 'G', 'I', 'J', 'K', 'M', 'O', 'P', 'R', 'V', 'W', 'X', 'Y', 'AA', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AN'] as const

export async function generatePHOReport(records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  const templateResponse = await fetch('/PHO_Template.xlsx')
  if (!templateResponse.ok) {
    throw new Error('Unable to load the PHO Excel template from /PHO_Template.xlsx.')
  }

  const templateBuffer = await templateResponse.arrayBuffer()
  const [{ Workbook }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')])
  const workbook = new Workbook()

  await workbook.xlsx.load(templateBuffer)

  workbook.creator = 'PHO Animal Bite Treatment Record'
  workbook.lastModifiedBy = 'PHO Animal Bite Treatment Record'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true
  workbook.calcProperties.forceFullCalc = true

  const datedRecords = filterRecordsByDateRange(records, startDate, endDate)
  const municipalityLabel = getMunicipalityLabel(datedRecords)
  const quarterBuckets = groupRecordsByQuarter(datedRecords)

  for (const quarter of [1, 2, 3, 4] as const) {
    const sheet = workbook.getWorksheet(QUARTER_SHEET_NAMES[quarter])
    if (!sheet) continue

    const quarterRows = buildReportRows(quarterBuckets[quarter])
    populateReportSheet(sheet, quarterRows, {
      municipalityLabel,
      periodLabel: buildQuarterPeriodLabel(quarter, quarterBuckets[quarter], startDate, endDate),
    })
  }

  const summarySheet = workbook.getWorksheet(SUMMARY_SHEET_NAME)
  if (summarySheet) {
    const summaryRows = buildReportRows(datedRecords)
    populateReportSheet(summarySheet, summaryRows, {
      municipalityLabel,
      periodLabel: buildSummaryPeriodLabel(datedRecords, startDate, endDate),
    })
  }

  applyTemplateSpecificOverrides(
    workbook.getWorksheet(resolveActiveSheetName(datedRecords, startDate, endDate)) ?? summarySheet ?? workbook.worksheets[0],
    datedRecords,
    startDate,
    endDate,
  )

  setActiveWorksheet(workbook, resolveActiveSheetName(datedRecords, startDate, endDate))

  const output = await workbook.xlsx.writeBuffer()
  const blob = new Blob(
    [output],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  )

  saveAs(blob, `PHO_Bite_Report_${sanitizeDateToken(startDate)}_to_${sanitizeDateToken(endDate)}.xlsx`)
}

function filterRecordsByDateRange(records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  return records.filter((record) => {
    const recordDate = getRecordDate(record)
    if (!recordDate) return true
    if (start && recordDate < start) return false
    if (end && recordDate > end) return false
    return true
  })
}

function groupRecordsByQuarter(records: AnimalBiteRecord[]) {
  const grouped: Record<QuarterNumber, AnimalBiteRecord[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  }

  records.forEach((record) => {
    const recordDate = getRecordDate(record)
    if (!recordDate) return
    grouped[getQuarter(recordDate)].push(record)
  })

  return grouped
}

function buildReportRows(records: AnimalBiteRecord[]) {
  const aggregates = new Map<string, PhoReportRow>()

  records.forEach((record) => {
    const key = getLocationLabel(record)
    const row = aggregates.get(key) ?? createEmptyRow(key)
    const category = normalizeText(record.category)
    const gender = normalizeText(record.gender)
    const ownership = normalizeText(record.ownership)
    const bitingAnimal = normalizeText(record.bitingAnimal)
    const isBooster = Boolean(record.booster)
    const hasRig = hasRigDose(record)
    const hasAnyPep = hasAnyPepTreatment(record)
    const hasCompletedPep = hasCompletedPepTreatment(record)
    const ageInMonths = resolveAgeInMonths(record)
    row.caseCount += 1

    if (gender === 'male') row.male += 1
    else if (gender === 'female') row.female += 1

    if (ageInMonths != null && ageInMonths < 180) row.under15 += 1
    else row.over15 += 1

    if (category === 'i') {
      row.categoryI += 1
    } else if (category === 'ii') {
      if (!hasAnyPep || normalizeText(record.humanArvStatus) === 'none') {
        row.categoryIINonEligible += 1
      } else if (isBooster) {
        row.categoryIIBooster += 1
      } else {
        row.categoryIIPrimary += 1
      }

      if (hasCompletedPep) {
        if (isBooster) row.pepCompletedCategoryIIBooster += 1
        else row.pepCompletedCategoryIIPrimary += 1
      }
    } else if (category === 'iii') {
      if (!hasAnyPep || normalizeText(record.humanArvStatus) === 'none') {
        row.categoryIIINonEligible += 1
      } else if (isBooster) {
        row.categoryIIIBooster += 1
      } else {
        row.categoryIIIPrimary += 1
      }

      if (hasCompletedPep) {
        if (isBooster) {
          row.pepCompletedCategoryIIIBooster += 1
        } else if (hasRig) {
          row.pepCompletedCategoryIIIErig += 1
        } else {
          row.pepCompletedCategoryIIIHrig += 1
        }
      }
    }

    if (bitingAnimal === 'dog') row.dog += 1
    else if (bitingAnimal === 'cat') row.cat += 1
    else row.others += 1

    if (ownership === 'owned') row.petDomestic += 1
    else if (ownership === 'stray') row.strayFreeRoaming += 1
    else row.unknownOwnership += 1

    // Keep the required sex totals aligned with case totals even when source data has blanks.
    const missingSexAssignments = row.caseCount - (row.male + row.female)
    if (missingSexAssignments > 0) {
      row.female += missingSexAssignments
    }

    aggregates.set(key, row)
  })

  const rows = Array.from(aggregates.values()).sort((a, b) => a.location.localeCompare(b.location))
  return condenseRows(rows)
}

function condenseRows(rows: PhoReportRow[]) {
  if (rows.length <= MAX_DETAIL_ROWS) return rows

  const visibleRows = rows.slice(0, MAX_DETAIL_ROWS - 1)
  const overflowRow = rows.slice(MAX_DETAIL_ROWS - 1).reduce(
    (merged, current) => mergeRows(merged, current),
    createEmptyRow('Other / Remaining Barangays'),
  )

  return [...visibleRows, overflowRow]
}

function mergeRows(base: PhoReportRow, extra: PhoReportRow): PhoReportRow {
  return {
    location: base.location,
    caseCount: base.caseCount + extra.caseCount,
    totalPopulation: base.totalPopulation + extra.totalPopulation,
    male: base.male + extra.male,
    female: base.female + extra.female,
    under15: base.under15 + extra.under15,
    over15: base.over15 + extra.over15,
    categoryI: base.categoryI + extra.categoryI,
    categoryIIPrimary: base.categoryIIPrimary + extra.categoryIIPrimary,
    categoryIIBooster: base.categoryIIBooster + extra.categoryIIBooster,
    categoryIINonEligible: base.categoryIINonEligible + extra.categoryIINonEligible,
    categoryIIIPrimary: base.categoryIIIPrimary + extra.categoryIIIPrimary,
    categoryIIIBooster: base.categoryIIIBooster + extra.categoryIIIBooster,
    categoryIIINonEligible: base.categoryIIINonEligible + extra.categoryIIINonEligible,
    pepCompletedCategoryIIPrimary: base.pepCompletedCategoryIIPrimary + extra.pepCompletedCategoryIIPrimary,
    pepCompletedCategoryIIBooster: base.pepCompletedCategoryIIBooster + extra.pepCompletedCategoryIIBooster,
    pepCompletedCategoryIIIErig: base.pepCompletedCategoryIIIErig + extra.pepCompletedCategoryIIIErig,
    pepCompletedCategoryIIIHrig: base.pepCompletedCategoryIIIHrig + extra.pepCompletedCategoryIIIHrig,
    pepCompletedCategoryIIIBooster: base.pepCompletedCategoryIIIBooster + extra.pepCompletedCategoryIIIBooster,
    dog: base.dog + extra.dog,
    cat: base.cat + extra.cat,
    others: base.others + extra.others,
    petDomestic: base.petDomestic + extra.petDomestic,
    strayFreeRoaming: base.strayFreeRoaming + extra.strayFreeRoaming,
    unknownOwnership: base.unknownOwnership + extra.unknownOwnership,
    humanRabiesCases: base.humanRabiesCases + extra.humanRabiesCases,
  }
}

function createEmptyRow(location: string): PhoReportRow {
  return {
    location,
    caseCount: 0,
    totalPopulation: 0,
    male: 0,
    female: 0,
    under15: 0,
    over15: 0,
    categoryI: 0,
    categoryIIPrimary: 0,
    categoryIIBooster: 0,
    categoryIINonEligible: 0,
    categoryIIIPrimary: 0,
    categoryIIIBooster: 0,
    categoryIIINonEligible: 0,
    pepCompletedCategoryIIPrimary: 0,
    pepCompletedCategoryIIBooster: 0,
    pepCompletedCategoryIIIErig: 0,
    pepCompletedCategoryIIIHrig: 0,
    pepCompletedCategoryIIIBooster: 0,
    dog: 0,
    cat: 0,
    others: 0,
    petDomestic: 0,
    strayFreeRoaming: 0,
    unknownOwnership: 0,
    humanRabiesCases: 0,
  }
}

function populateReportSheet(
  worksheet: Worksheet,
  rows: PhoReportRow[],
  options: {
    municipalityLabel: string
    periodLabel: string
  },
) {
  worksheet.getCell('C7').value = options.municipalityLabel
  worksheet.getCell('J7').value = options.periodLabel

  for (let rowNumber = DETAIL_START_ROW; rowNumber <= DETAIL_END_ROW; rowNumber += 1) {
    resetInputCells(worksheet, rowNumber)
    applyComputedFormulas(worksheet, rowNumber)
  }

  rows.forEach((row, index) => {
    const rowNumber = DETAIL_START_ROW + index
    if (rowNumber > DETAIL_END_ROW) return

    worksheet.getCell(`A${rowNumber}`).value = row.location
    worksheet.getCell(`B${rowNumber}`).value = row.totalPopulation
    worksheet.getCell(`C${rowNumber}`).value = row.male
    worksheet.getCell(`D${rowNumber}`).value = row.female
    worksheet.getCell(`F${rowNumber}`).value = row.under15
    worksheet.getCell(`G${rowNumber}`).value = row.over15
    worksheet.getCell(`I${rowNumber}`).value = row.categoryI
    worksheet.getCell(`J${rowNumber}`).value = row.categoryIIPrimary
    worksheet.getCell(`K${rowNumber}`).value = row.categoryIIBooster
    worksheet.getCell(`M${rowNumber}`).value = row.categoryIINonEligible
    worksheet.getCell(`O${rowNumber}`).value = row.categoryIIIPrimary
    worksheet.getCell(`P${rowNumber}`).value = row.categoryIIIBooster
    worksheet.getCell(`R${rowNumber}`).value = row.categoryIIINonEligible
    worksheet.getCell(`V${rowNumber}`).value = row.pepCompletedCategoryIIPrimary
    worksheet.getCell(`W${rowNumber}`).value = row.pepCompletedCategoryIIBooster
    worksheet.getCell(`X${rowNumber}`).value = row.pepCompletedCategoryIIIErig
    worksheet.getCell(`Y${rowNumber}`).value = row.pepCompletedCategoryIIIHrig
    worksheet.getCell(`AA${rowNumber}`).value = row.pepCompletedCategoryIIIBooster
    worksheet.getCell(`AG${rowNumber}`).value = row.dog
    worksheet.getCell(`AH${rowNumber}`).value = row.cat
    worksheet.getCell(`AI${rowNumber}`).value = row.others
    worksheet.getCell(`AJ${rowNumber}`).value = row.petDomestic
    worksheet.getCell(`AK${rowNumber}`).value = row.strayFreeRoaming
    worksheet.getCell(`AL${rowNumber}`).value = row.unknownOwnership
    worksheet.getCell(`AN${rowNumber}`).value = row.humanRabiesCases
  })

  applyTotalRowFormulas(worksheet, TOTAL_ROW)
}

function resetInputCells(worksheet: Worksheet, rowNumber: number) {
  worksheet.getCell(`A${rowNumber}`).value = ''

  INPUT_NUMERIC_COLUMNS.forEach((column) => {
    worksheet.getCell(`${column}${rowNumber}`).value = 0
  })

  // TODO: Replace this placeholder population source once barangay population data is available.
  worksheet.getCell(`B${rowNumber}`).value = 0
}

function applyComputedFormulas(worksheet: Worksheet, rowNumber: number) {
  setFormula(worksheet, `E${rowNumber}`, `SUM(C${rowNumber},D${rowNumber})`)
  setFormula(worksheet, `H${rowNumber}`, `F${rowNumber}+G${rowNumber}`)
  setFormula(worksheet, `L${rowNumber}`, `SUM(J${rowNumber},K${rowNumber})`)
  setFormula(worksheet, `N${rowNumber}`, `SUM(M${rowNumber})`)
  setFormula(worksheet, `Q${rowNumber}`, `SUM(O${rowNumber},P${rowNumber})`)
  setFormula(worksheet, `S${rowNumber}`, `SUM(Q${rowNumber},R${rowNumber})`)
  setFormula(worksheet, `T${rowNumber}`, `SUM(L${rowNumber},Q${rowNumber})`)
  setFormula(worksheet, `U${rowNumber}`, `SUM(I${rowNumber},N${rowNumber},S${rowNumber})`)
  setFormula(worksheet, `Z${rowNumber}`, `SUM(X${rowNumber},Y${rowNumber})`)
  setFormula(worksheet, `AB${rowNumber}`, `IFERROR(V${rowNumber}/J${rowNumber}, 0)`)
  setFormula(worksheet, `AC${rowNumber}`, `IFERROR(W${rowNumber}/K${rowNumber}, 0)`)
  setFormula(worksheet, `AD${rowNumber}`, `IFERROR(Z${rowNumber}/O${rowNumber}, 0)`)
  setFormula(worksheet, `AE${rowNumber}`, `IFERROR(AA${rowNumber}/P${rowNumber}, 0)`)
  setFormula(worksheet, `AF${rowNumber}`, `IFERROR(SUM(V${rowNumber},W${rowNumber},Z${rowNumber},AA${rowNumber})/SUM(L${rowNumber},Q${rowNumber}), 0)`)
  setFormula(worksheet, `AM${rowNumber}`, `SUM(AG${rowNumber},AH${rowNumber},AI${rowNumber})`)
  setFormula(worksheet, `AO${rowNumber}`, `IFERROR((AN${rowNumber}/B${rowNumber})*1000000, 0)`)
}

function applyTotalRowFormulas(worksheet: Worksheet, rowNumber: number) {
  worksheet.getCell(`A${rowNumber}`).value = 'TOTAL'

  for (const column of ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN'] as const) {
    setFormula(worksheet, `${column}${rowNumber}`, `SUM(${column}${DETAIL_START_ROW}:${column}${DETAIL_END_ROW})`)
  }

  setFormula(worksheet, `AB${rowNumber}`, `IFERROR(V${rowNumber}/J${rowNumber}, 0)`)
  setFormula(worksheet, `AC${rowNumber}`, `IFERROR(W${rowNumber}/K${rowNumber}, 0)`)
  setFormula(worksheet, `AD${rowNumber}`, `IFERROR(Z${rowNumber}/O${rowNumber}, 0)`)
  setFormula(worksheet, `AE${rowNumber}`, `IFERROR(AA${rowNumber}/P${rowNumber}, 0)`)
  setFormula(worksheet, `AF${rowNumber}`, `IFERROR(SUM(V${rowNumber},W${rowNumber},Z${rowNumber},AA${rowNumber})/SUM(L${rowNumber},Q${rowNumber}), 0)`)
  setFormula(worksheet, `AO${rowNumber}`, `IFERROR((AN${rowNumber}/B${rowNumber})*1000000, 0)`)
}

function setFormula(worksheet: Worksheet, address: string, formula: string) {
  worksheet.getCell(address).value = { formula, result: 0 }
}

function applyTemplateSpecificOverrides(worksheet: Worksheet, records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  // TODO: Map the province-approved fixed cell coordinates once the final PHO layout is confirmed.
  // Example:
  // worksheet.getCell('B15').value = records.length
  // worksheet.getCell('C7').value = 'Roxas'
  // worksheet.getCell('J7').value = `${startDate} to ${endDate}`

  // TODO: Split Category III completed counts into ERIG vs HRIG if the source schema gains
  // a dedicated field that distinguishes which immunoglobulin was administered.
  void worksheet
  void records
  void startDate
  void endDate
}

function resolveActiveSheetName(records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  const quarterSet = new Set<QuarterNumber>()

  records.forEach((record) => {
    const recordDate = getRecordDate(record)
    if (!recordDate) return
    quarterSet.add(getQuarter(recordDate))
  })

  if (quarterSet.size === 1) {
    return QUARTER_SHEET_NAMES[Array.from(quarterSet)[0]]
  }

  if (quarterSet.size === 0 && startDate && endDate) {
    const start = parseDate(startDate)
    const end = parseDate(endDate)
    if (start && end && start.getFullYear() === end.getFullYear() && getQuarter(start) === getQuarter(end)) {
      return QUARTER_SHEET_NAMES[getQuarter(start)]
    }
  }

  return SUMMARY_SHEET_NAME
}

function setActiveWorksheet(workbook: { worksheets: Worksheet[]; views?: { activeTab?: number }[] }, sheetName: string) {
  const activeSheetIndex = workbook.worksheets.findIndex((worksheet) => worksheet.name === sheetName)
  if (activeSheetIndex < 0) return
  workbook.views = [{ activeTab: activeSheetIndex }]
}

function buildQuarterPeriodLabel(quarter: QuarterNumber, records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  const years = getDistinctYears(records)
  if (years.length === 1) return `Quarter ${quarter}, ${years[0]}`

  const fallbackYear = getRangeYear(startDate, endDate)
  if (fallbackYear) return `Quarter ${quarter}, ${fallbackYear}`

  return `Quarter ${quarter}, Selected Range`
}

function buildSummaryPeriodLabel(records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  if (startDate || endDate) {
    return `${startDate || 'Start'} to ${endDate || 'End'}`
  }

  const years = getDistinctYears(records)
  if (years.length === 1) return `Annual Summary, ${years[0]}`
  return 'Annual Summary'
}

function getDistinctYears(records: AnimalBiteRecord[]) {
  return Array.from(
    new Set(
      records
        .map(getRecordDate)
        .filter((value): value is Date => value instanceof Date)
        .map((value) => value.getFullYear()),
    ),
  ).sort()
}

function getRangeYear(startDate?: string | null, endDate?: string | null) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (start && end && start.getFullYear() === end.getFullYear()) {
    return start.getFullYear()
  }

  return start?.getFullYear() ?? end?.getFullYear() ?? null
}

function getMunicipalityLabel(records: AnimalBiteRecord[]) {
  const municipalities = Array.from(
    new Set(
      records
        .map((record) => record.municipality?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  )

  if (municipalities.length === 1) return municipalities[0]
  if (municipalities.length > 1) return 'Multiple Municipalities'
  return 'All Municipalities'
}

function getLocationLabel(record: AnimalBiteRecord) {
  return record.barangay?.trim() || record.municipality?.trim() || 'Unknown Location'
}

function getTotalCases(row: PhoReportRow) {
  return row.caseCount
}

function hasAnyPepTreatment(record: AnimalBiteRecord) {
  return Boolean(
    record.fullRegimen ||
    record.booster ||
    hasRigDose(record) ||
    record.day0 ||
    record.day3 ||
    record.day7 ||
    record.day14 ||
    record.day2128 ||
    (record.humanArvStatus && normalizeText(record.humanArvStatus) !== 'none'),
  )
}

function hasCompletedPepTreatment(record: AnimalBiteRecord) {
  return Boolean(record.fullRegimen || normalizeText(record.humanArvStatus) === 'complete')
}

function hasRigDose(record: AnimalBiteRecord) {
  return Boolean(record.erigHrigActualDose || record.erigHrigComputedDose || record.erigHrigDateGiven)
}

function resolveAgeInMonths(record: AnimalBiteRecord) {
  if (typeof record.ageInMonths === 'number' && !Number.isNaN(record.ageInMonths)) {
    return record.ageInMonths
  }

  if (record.age) {
    const years = /(\d+)\s*yr/.exec(record.age.toLowerCase())
    const months = /(\d+)\s*mo/.exec(record.age.toLowerCase())
    if (years || months) {
      return Number(years?.[1] || 0) * 12 + Number(months?.[1] || 0)
    }
  }

  return null
}

function getRecordDate(record: AnimalBiteRecord) {
  return parseDate(record.dateOfVisit || record.createdAt || null)
}

function parseDate(value?: string | null) {
  if (!value) return null

  const normalized = value.length <= 10 ? `${value}T00:00:00` : value
  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function getQuarter(date: Date): QuarterNumber {
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return Math.min(4, Math.max(1, quarter)) as QuarterNumber
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() || ''
}

function sanitizeDateToken(value?: string | null) {
  return (value || 'all-time').replace(/[^\d-]/g, '_')
}
