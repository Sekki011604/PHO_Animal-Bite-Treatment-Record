import type { Worksheet } from 'exceljs'
import { AnimalBiteRecord } from '../types'
import {
  computeDOHClassification,
  type DOHAnimalStatusGroup,
  type DOHAgeBucket,
  type DOHBitingAnimalGroup,
  type DOHClassification,
  type DOHCompletionStatus,
  type DOHDoseKey,
  type DOHImmunizationHistory,
  type DOHPepEligibility,
  type DOHRigType,
} from './dohReportClassifier'

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

type ClassifiedAnimalBiteRecord = {
  record: AnimalBiteRecord
  classification: DOHClassification
}

type WorkbookLike = {
  addWorksheet: (name: string) => Worksheet
  getWorksheet: (name: string) => Worksheet | undefined
  removeWorksheet: (id: number) => void
  worksheets: Worksheet[]
  views?: { activeTab?: number }[]
}

const QUARTER_SHEET_NAMES: Record<QuarterNumber, string> = {
  1: 'Quarter 1',
  2: 'Quarter 2',
  3: 'Quarter 3',
  4: 'Quarter 4',
}

const SUMMARY_SHEET_NAME = 'Summary'
const CLASSIFIED_RECORDS_SHEET_NAME = 'DOH Classified Records'
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
  const classifiedRecords = classifyRecords(datedRecords)
  const municipalityLabel = getMunicipalityLabel(datedRecords)
  const quarterBuckets = groupRecordsByQuarter(classifiedRecords)

  for (const quarter of [1, 2, 3, 4] as const) {
    const sheet = workbook.getWorksheet(QUARTER_SHEET_NAMES[quarter])
    if (!sheet) continue

    const quarterRows = buildReportRows(quarterBuckets[quarter])
    populateReportSheet(sheet, quarterRows, {
      municipalityLabel,
      periodLabel: buildQuarterPeriodLabel(quarter, quarterBuckets[quarter].map(({ record }) => record), startDate, endDate),
    })
  }

  const summarySheet = workbook.getWorksheet(SUMMARY_SHEET_NAME)
  if (summarySheet) {
    const summaryRows = buildReportRows(classifiedRecords)
    populateReportSheet(summarySheet, summaryRows, {
      municipalityLabel,
      periodLabel: buildSummaryPeriodLabel(datedRecords, startDate, endDate),
    })
  }

  appendClassifiedRecordsSheet(workbook, classifiedRecords)

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

function classifyRecords(records: AnimalBiteRecord[]): ClassifiedAnimalBiteRecord[] {
  return records.map((record) => ({
    record,
    classification: computeDOHClassification(record),
  }))
}

function groupRecordsByQuarter(records: ClassifiedAnimalBiteRecord[]) {
  const grouped: Record<QuarterNumber, ClassifiedAnimalBiteRecord[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  }

  records.forEach((entry) => {
    const recordDate = getRecordDate(entry.record)
    if (!recordDate) return
    grouped[getQuarter(recordDate)].push(entry)
  })

  return grouped
}

function buildReportRows(records: ClassifiedAnimalBiteRecord[]) {
  const aggregates = new Map<string, PhoReportRow>()

  records.forEach(({ record, classification }) => {
    const key = getLocationLabel(record)
    const row = aggregates.get(key) ?? createEmptyRow(key)
    const gender = normalizeText(record.gender)
    row.caseCount += 1

    if (gender === 'male') row.male += 1
    else if (gender === 'female') row.female += 1

    if (classification.ageBucket === 'under_15') row.under15 += 1
    else if (classification.ageBucket === '15_and_above') row.over15 += 1

    applyPepClassificationTotals(row, classification)
    applyPepCompletionTotals(row, record, classification)
    applyAnimalTotals(row, classification)

    aggregates.set(key, row)
  })

  const rows = Array.from(aggregates.values()).sort((a, b) => a.location.localeCompare(b.location))
  return condenseRows(rows)
}

function applyPepClassificationTotals(row: PhoReportRow, classification: DOHClassification) {
  switch (classification.regimenType) {
    case 'none':
      row.categoryI += 1
      break
    case 'category_ii_primary_cceev':
      row.categoryIIPrimary += 1
      break
    case 'category_ii_booster_cceev':
      row.categoryIIBooster += 1
      break
    case 'category_ii_non_eligible':
      row.categoryIINonEligible += 1
      break
    case 'category_iii_primary_cceev_rig':
      row.categoryIIIPrimary += 1
      break
    case 'category_iii_booster_cceev_only':
      row.categoryIIIBooster += 1
      break
    case 'category_iii_non_eligible':
      row.categoryIIINonEligible += 1
      break
    default:
      if (classification.dohCategory === 'I') row.categoryI += 1
      else if (classification.dohCategory === 'II') row.categoryIINonEligible += 1
      else if (classification.dohCategory === 'III') row.categoryIIINonEligible += 1
      break
  }
}

function applyPepCompletionTotals(row: PhoReportRow, record: AnimalBiteRecord, classification: DOHClassification) {
  if (classification.dohCategory === 'III') {
    const completedCategoryThreeBucket = resolveCompletedCategoryThreeBucket(record, classification)

    if (completedCategoryThreeBucket === 'erig') row.pepCompletedCategoryIIIErig += 1
    else if (completedCategoryThreeBucket === 'hrig') row.pepCompletedCategoryIIIHrig += 1
    else if (completedCategoryThreeBucket === 'booster') row.pepCompletedCategoryIIIBooster += 1

    return
  }

  if (classification.completionStatus !== 'completed') return

  switch (classification.regimenType) {
    case 'category_ii_primary_cceev':
      row.pepCompletedCategoryIIPrimary += 1
      break
    case 'category_ii_booster_cceev':
      row.pepCompletedCategoryIIBooster += 1
      break
    case 'category_iii_primary_cceev_rig':
      if (classification.rigType === 'erig') row.pepCompletedCategoryIIIErig += 1
      else if (classification.rigType === 'hrig') row.pepCompletedCategoryIIIHrig += 1
      break
    case 'category_iii_booster_cceev_only':
      row.pepCompletedCategoryIIIBooster += 1
      break
    default:
      break
  }
}

function resolveCompletedCategoryThreeBucket(
  record: AnimalBiteRecord,
  classification: DOHClassification,
): 'erig' | 'hrig' | 'booster' | null {
  if (classification.regimenType === 'category_iii_booster_cceev_only') {
    return classification.completionStatus === 'completed' ? 'booster' : null
  }

  if (classification.regimenType !== 'category_iii_primary_cceev_rig') {
    return null
  }

  if (classification.completionStatus === 'completed') {
    if (classification.rigType === 'erig') return 'erig'
    if (classification.rigType === 'hrig') return 'hrig'
  }

  if (classification.doseProgress.missingDoseKeys.length > 0) {
    return null
  }

  return hasRecordedRigTreatment(record) ? null : 'booster'
}

function hasRecordedRigTreatment(record: AnimalBiteRecord) {
  const rigType = normalizeText(record.rigType)

  return Boolean(
    rigType === 'erig' ||
    rigType === 'hrig' ||
    record.rigVolume ||
    record.erigHrigComputedDose ||
    record.erigHrigActualDose ||
    record.erigHrigDateGiven,
  )
}

function applyAnimalTotals(row: PhoReportRow, classification: DOHClassification) {
  if (classification.bitingAnimalGroup === 'dog') row.dog += 1
  else if (classification.bitingAnimalGroup === 'cat') row.cat += 1
  else if (classification.bitingAnimalGroup === 'other') row.others += 1

  if (classification.animalStatusGroup === 'pet_domestic') row.petDomestic += 1
  else if (classification.animalStatusGroup === 'stray_free_roaming') row.strayFreeRoaming += 1
  else row.unknownOwnership += 1
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

function appendClassifiedRecordsSheet(workbook: WorkbookLike, records: ClassifiedAnimalBiteRecord[]) {
  const existingSheet = workbook.getWorksheet(CLASSIFIED_RECORDS_SHEET_NAME)
  if (existingSheet && typeof existingSheet.id === 'number') {
    workbook.removeWorksheet(existingSheet.id)
  }

  const worksheet = workbook.addWorksheet(CLASSIFIED_RECORDS_SHEET_NAME)
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.columns = [
    { header: 'Date of Visit', key: 'dateOfVisit', width: 14 },
    { header: 'Registry No.', key: 'registrationNumber', width: 16 },
    { header: 'Full Name', key: 'fullName', width: 24 },
    { header: 'Municipality', key: 'municipality', width: 18 },
    { header: 'Barangay', key: 'barangay', width: 18 },
    { header: 'Sex', key: 'gender', width: 10 },
    { header: 'Age', key: 'age', width: 12 },
    { header: 'DOH Age Bucket', key: 'ageBucket', width: 18 },
    { header: 'Biting Animal', key: 'bitingAnimal', width: 16 },
    { header: 'DOH Animal Group', key: 'bitingAnimalGroup', width: 18 },
    { header: 'Ownership', key: 'ownership', width: 16 },
    { header: 'DOH Animal Status', key: 'animalStatusGroup', width: 22 },
    { header: 'Category', key: 'category', width: 10 },
    { header: 'DOH Category', key: 'dohCategory', width: 14 },
    { header: 'Human ARV Status', key: 'humanArvStatus', width: 18 },
    { header: 'Date Last Vaccination', key: 'dateLastVaccination', width: 18 },
    { header: 'Immunization History', key: 'immunizationHistory', width: 24 },
    { header: 'Immunocompromised', key: 'immunocompromised', width: 18 },
    { header: 'Anti-Rabies Vaccination', key: 'antiRabiesVaccination', width: 22 },
    { header: 'Animal Status After Day 14', key: 'animalStatusAfterDay14', width: 24 },
    { header: 'RIG Type', key: 'rigType', width: 12 },
    { header: 'RIG Computed Dose', key: 'erigHrigComputedDose', width: 18 },
    { header: 'RIG Actual Dose', key: 'erigHrigActualDose', width: 18 },
    { header: 'RIG Date Given', key: 'erigHrigDateGiven', width: 16 },
    { header: 'Day 0', key: 'day0', width: 12 },
    { header: 'Day 0 Location', key: 'day0Location', width: 20 },
    { header: 'Day 3', key: 'day3', width: 12 },
    { header: 'Day 3 Location', key: 'day3Location', width: 20 },
    { header: 'Day 7', key: 'day7', width: 12 },
    { header: 'Day 7 Location', key: 'day7Location', width: 20 },
    { header: 'Day 14', key: 'day14', width: 12 },
    { header: 'Day 14 Location', key: 'day14Location', width: 20 },
    { header: 'Day 21/28', key: 'day2128', width: 12 },
    { header: 'Day 21/28 Location', key: 'day2128Location', width: 20 },
    { header: 'PEP Eligibility', key: 'pepEligibility', width: 18 },
    { header: 'PEP Eligibility Reason', key: 'pepEligibilityReason', width: 42 },
    { header: 'Regimen Type', key: 'regimenType', width: 30 },
    { header: 'Completion Status', key: 'completionStatus', width: 18 },
    { header: 'Completion Reason', key: 'completionReason', width: 36 },
    { header: 'Required Doses', key: 'requiredDoseKeys', width: 18 },
    { header: 'Documented Doses', key: 'documentedDoseKeys', width: 18 },
    { header: 'Missing Doses', key: 'missingDoseKeys', width: 18 },
    { header: 'Documented Dose Locations', key: 'documentedLocationKeys', width: 22 },
    { header: 'High-Risk Criteria', key: 'highRiskCriteria', width: 52 },
  ]

  records.forEach(({ record, classification }) => {
    worksheet.addRow({
      dateOfVisit: record.dateOfVisit || '',
      registrationNumber: record.registrationNumber || '',
      fullName: record.fullName || '',
      municipality: record.municipality || '',
      barangay: record.barangay || '',
      gender: formatGender(record.gender),
      age: record.age || '',
      ageBucket: formatAgeBucket(classification.ageBucket),
      bitingAnimal: formatBitingAnimalValue(record),
      bitingAnimalGroup: formatBitingAnimalGroup(classification.bitingAnimalGroup),
      ownership: formatOwnership(record.ownership),
      animalStatusGroup: formatAnimalStatusGroup(classification.animalStatusGroup),
      category: record.category || '',
      dohCategory: classification.dohCategory,
      humanArvStatus: formatHumanArvStatus(record.humanArvStatus),
      dateLastVaccination: record.dateLastVaccination || '',
      immunizationHistory: formatImmunizationHistory(classification.immunizationHistory),
      immunocompromised: classification.immunocompromised ? 'Yes' : 'No',
      antiRabiesVaccination: formatAnimalVaccinationStatus(record.antiRabiesVaccination),
      animalStatusAfterDay14: formatAnimalStatusAfterDay14(record.animalStatusAfterDay14),
      rigType: formatRigType(classification.rigType),
      erigHrigComputedDose: record.erigHrigComputedDose || record.rigVolume || '',
      erigHrigActualDose: record.erigHrigActualDose || '',
      erigHrigDateGiven: record.erigHrigDateGiven || '',
      day0: record.day0 || '',
      day0Location: record.day0Location || '',
      day3: record.day3 || '',
      day3Location: record.day3Location || '',
      day7: record.day7 || '',
      day7Location: record.day7Location || '',
      day14: record.day14 || '',
      day14Location: record.day14Location || '',
      day2128: record.day2128 || '',
      day2128Location: record.day2128Location || '',
      pepEligibility: formatPepEligibility(classification.pepEligibility),
      pepEligibilityReason: classification.pepEligibilityReason,
      regimenType: classification.regimenLabel,
      completionStatus: formatCompletionStatus(classification.completionStatus),
      completionReason: classification.completionReason,
      requiredDoseKeys: formatDoseKeys(classification.doseProgress.requiredDoseKeys),
      documentedDoseKeys: formatDoseKeys(classification.doseProgress.documentedDoseKeys),
      missingDoseKeys: formatDoseKeys(classification.doseProgress.missingDoseKeys),
      documentedLocationKeys: formatDoseKeys(classification.doseProgress.documentedLocationKeys),
      highRiskCriteria: formatHighRiskCriteria(classification),
    })
  })

  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FF103F2E' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F3E6' },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB7C8B1' } },
      bottom: { style: 'thin', color: { argb: 'FFB7C8B1' } },
      left: { style: 'thin', color: { argb: 'FFB7C8B1' } },
      right: { style: 'thin', color: { argb: 'FFB7C8B1' } },
    }
  })

  worksheet.autoFilter = {
    from: 'A1',
    to: `${columnNumberToName(worksheet.columns.length)}1`,
  }
}

function formatGender(value?: string | null) {
  const normalized = normalizeText(value)
  if (normalized === 'male') return 'Male'
  if (normalized === 'female') return 'Female'
  return ''
}

function formatAgeBucket(value: DOHAgeBucket) {
  if (value === 'under_15') return '<15 years old'
  if (value === '15_and_above') return '15 years old and above'
  return 'Unknown'
}

function formatBitingAnimalValue(record: AnimalBiteRecord) {
  const animal = normalizeText(record.bitingAnimal)
  if (animal === 'dog') return 'Dog'
  if (animal === 'cat') return 'Cat'
  if (animal === 'others') return record.bitingAnimalOthers?.trim() || 'Other'
  return record.bitingAnimalOthers?.trim() || ''
}

function formatBitingAnimalGroup(value: DOHBitingAnimalGroup) {
  if (value === 'dog') return 'Dog'
  if (value === 'cat') return 'Cat'
  if (value === 'other') return 'Other'
  return 'Unknown'
}

function formatOwnership(value?: string | null) {
  const normalized = normalizeText(value)
  if (normalized === 'owned') return 'Owned / Pet / Domestic'
  if (normalized === 'stray') return 'Stray / Free-Roaming'
  return ''
}

function formatAnimalStatusGroup(value: DOHAnimalStatusGroup) {
  if (value === 'pet_domestic') return 'Owned / Pet / Domestic'
  if (value === 'stray_free_roaming') return 'Stray / Free-Roaming'
  return 'Unknown'
}

function formatHumanArvStatus(value?: string | null) {
  const normalized = normalizeText(value)
  if (normalized === 'complete') return 'Complete'
  if (normalized === 'incomplete') return 'Incomplete'
  if (normalized === 'none') return 'None'
  return ''
}

function formatImmunizationHistory(value: DOHImmunizationHistory) {
  if (value === 'immunologically_naive') return 'Immunologically-naive'
  if (value === 'previously_immunized') return 'Previously-immunized'
  return 'Unknown'
}

function formatAnimalVaccinationStatus(value?: string | null) {
  const normalized = normalizeText(value)
  if (normalized === 'with_vaccination') return 'Vaccinated'
  if (normalized === 'none') return 'None / Unknown'
  return ''
}

function formatAnimalStatusAfterDay14(value?: string | null) {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatRigType(value: DOHRigType) {
  if (value === 'erig') return 'ERIG'
  if (value === 'hrig') return 'HRIG'
  if (value === 'none') return 'None'
  return 'Unknown'
}

function formatPepEligibility(value: DOHPepEligibility) {
  if (value === 'pep_eligible') return 'PEP Eligible'
  if (value === 'pep_non_eligible') return 'PEP Non-Eligible'
  return 'Not Applicable'
}

function formatCompletionStatus(value: DOHCompletionStatus) {
  if (value === 'completed') return 'Completed'
  if (value === 'incomplete') return 'Incomplete'
  return 'Not Applicable'
}

function formatDoseKeys(values: DOHDoseKey[]) {
  if (values.length === 0) return ''

  return values
    .map((value) => {
      if (value === 'day0') return 'D0'
      if (value === 'day3') return 'D3'
      if (value === 'day7') return 'D7'
      if (value === 'day14') return 'D14'
      return 'D21/28'
    })
    .join(', ')
}

function formatHighRiskCriteria(classification: DOHClassification) {
  const flags: string[] = []
  const { highRiskCriteria } = classification

  if (highRiskCriteria.previouslyVaccinatedOverSixMonths) {
    flags.push('Previously immunized more than 6 months ago')
  }
  if (highRiskCriteria.animalUnavailableOrHighRisk) {
    flags.push('Animal unavailable for observation, died, or high-risk species')
  }
  if (highRiskCriteria.highlyInnervatedWound) {
    flags.push('Highly innervated wound site')
  }
  if (highRiskCriteria.multipleOrDeepWounds) {
    flags.push('Multiple or deep wounds')
  }
  if (highRiskCriteria.uncontrolledComorbidities) {
    flags.push('Uncontrolled comorbidities or immunocompromised')
  }
  if (highRiskCriteria.hardToReachArea) {
    flags.push('Hard-to-reach area')
  }
  if (highRiskCriteria.vaccinatedAnimalAvailableForObservation && !highRiskCriteria.any) {
    flags.push('Vaccinated animal available for 14-day observation')
  }

  return flags.join('; ') || 'None documented'
}

function columnNumberToName(columnNumber: number) {
  let dividend = columnNumber
  let columnName = ''

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }

  return columnName
}

function applyTemplateSpecificOverrides(worksheet: Worksheet, records: AnimalBiteRecord[], startDate?: string | null, endDate?: string | null) {
  // TODO: Map the province-approved fixed cell coordinates once the final PHO layout is confirmed.
  // Example:
  // worksheet.getCell('B15').value = records.length
  // worksheet.getCell('C7').value = 'Roxas'
  // worksheet.getCell('J7').value = `${startDate} to ${endDate}`

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
