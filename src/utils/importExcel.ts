import * as XLSX from 'xlsx'

type ImportedAnimalBiteRecord = {
  registration_number: string
  date_of_visit: string
  full_name: string
  municipality: string
  barangay: string
  address: string
  contact_number: string
  age: string
  age_in_months: number | null
  gender: string
  date_of_birth: string | null
  philhealth_member: string
  philhealth_number: string
  allergies: string
  immunocompromised_status: string
  specify_illness: string
  intake_steroids_chloroquine: boolean
  bp: string
  hr: string
  rr: string
  temp: string
  patient_weight: string
  biting_animal: string
  biting_animal_others: string
  ownership: string
  anti_rabies_vaccination: string
  category: string
  circumstance: string
  type_of_exposure: string
  date_of_exposure: string | null
  place_of_exposure: string
  human_arv_status: string
  date_last_vaccination: string | null
  bite_site_notes: string
  washing_bite_wound: boolean
  full_regimen: boolean
  booster: boolean
  vaccine_generic_name: string
  vaccine_brand_name: string
  vaccine_route: string
  day0: string | null
  day3: string | null
  day7: string | null
  day14: string | null
  day2128: string | null
  animal_status_after_day14: string
  erig_hrig_computed_dose: string
  erig_hrig_actual_dose: string
  erig_hrig_date_given: string | null
  tetanus_wound_type: string
  tetanus_date_last: string | null
  tetanus_toxoid: string
  ats: string
  diagnosis_notes: string
  progress_notes: string
  nurse_in_charge: string
  physician_charge: string
  created_at: string
  updated_at: string
}

type ParsedImportResult = {
  records: ImportedAnimalBiteRecord[]
  skippedCount: number
  sheetName: string
  headerRow: number
}

type HeaderField =
  | 'date_of_visit'
  | 'registration_number'
  | 'full_name'
  | 'age'
  | 'gender'
  | 'biting_animal'
  | 'category'
  | 'type_of_exposure'
  | 'physician_charge'
  | 'municipality'
  | 'barangay'

type SheetDetection = {
  sheetName: string
  headerRowIndex: number
  headerMap: Partial<Record<HeaderField, number>>
  score: number
  context: SheetContext
}

type SheetContext = {
  municipality: string
  barangay: string
  physician_charge: string
}

const HEADER_SYNONYMS: Record<HeaderField, string[]> = {
  date_of_visit: [
    'dateofvisit',
    'visitdate',
    'datevisited',
    'consultationdate',
    'dateofconsultation',
    'dateofconsult',
    'date',
  ],
  registration_number: [
    'regno',
    'regnumber',
    'registrationno',
    'registrationnumber',
    'registryno',
    'registrynumber',
    'registryno',
    'recordno',
    'recordnumber',
    'caseno',
    'casenumber',
  ],
  full_name: [
    'fullname',
    'patientname',
    'nameofpatient',
    'clientname',
    'patientfullname',
    'name',
  ],
  age: [
    'age',
    'patientage',
  ],
  gender: [
    'gender',
    'sex',
  ],
  biting_animal: [
    'bitinganimal',
    'animaltype',
    'animal',
    'animalbiting',
  ],
  category: [
    'bitecategory',
    'exposurecategory',
    'category',
  ],
  type_of_exposure: [
    'typeofexposure',
    'exposuretype',
    'exposure',
  ],
  physician_charge: [
    'physician',
    'doctor',
    'attendingphysician',
    'physicianincharge',
    'doctorincharge',
  ],
  municipality: [
    'municipality',
    'citymunicipality',
    'cityormunicipality',
  ],
  barangay: [
    'barangay',
    'brgy',
    'barangaylocation',
  ],
}

const SUMMARY_ONLY_SHEET_NAMES = new Set([
  'template',
  'quarter1',
  'quarter2',
  'quarter3',
  'quarter4',
  'summary',
  'draftmftanimalbiteandrab',
])

export async function parseAnimalBiteImportFile(file: File): Promise<ParsedImportResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    dense: true,
  })

  const detection = detectRegistrySheet(workbook)
  if (!detection) {
    const normalizedSheetNames = workbook.SheetNames.map((sheetName) => normalizeCellText(sheetName))
    const looksLikeSummaryOnlyWorkbook = normalizedSheetNames.every((sheetName) => SUMMARY_ONLY_SHEET_NAMES.has(sheetName))

    if (looksLikeSummaryOnlyWorkbook) {
      throw new Error('This workbook only contains quarterly summary sheets. It does not include a line-list or registry sheet with individual patient rows to import.')
    }

    throw new Error('No patient line-list sheet was found. Expected headers like Date of Visit, Patient Name, Age, Gender, Animal, Category, Municipality, and Barangay.')
  }

  const worksheet = workbook.Sheets[detection.sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  })

  const now = new Date().toISOString()
  const records: ImportedAnimalBiteRecord[] = []
  let skippedCount = 0
  let blankRowStreak = 0

  for (let rowIndex = detection.headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || []
    const visibleValues = Object.values(detection.headerMap).map((columnIndex) => row[columnIndex ?? -1])

    if (visibleValues.every((value) => isEmptyCell(value))) {
      blankRowStreak += 1
      if (blankRowStreak >= 10) break
      continue
    }

    blankRowStreak = 0

    const mappedRecord = mapImportedRow(row, detection.headerMap, detection.context, now)
    if (!mappedRecord) {
      skippedCount += 1
      continue
    }

    records.push(mappedRecord)
  }

  if (records.length === 0) {
    throw new Error(`No valid patient rows were found in "${detection.sheetName}". Check that the file includes a row-by-row line list and not only summary totals.`)
  }

  return {
    records,
    skippedCount,
    sheetName: detection.sheetName,
    headerRow: detection.headerRowIndex + 1,
  }
}

function detectRegistrySheet(workbook: XLSX.WorkBook): SheetDetection | null {
  let bestMatch: SheetDetection | null = null

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      raw: true,
      blankrows: false,
    })

    const context = extractSheetContext(rows)
    const sheetNameBonus = getSheetNameBonus(sheetName)

    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 60); rowIndex += 1) {
      const headerMap = buildHeaderMap(rows[rowIndex] || [])
      const headerCount = Object.keys(headerMap).length

      if (headerCount < 4 || headerMap.full_name == null) continue
      if (headerMap.date_of_visit == null && headerMap.registration_number == null) continue

      const score =
        headerCount +
        sheetNameBonus +
        (headerMap.date_of_visit != null ? 4 : 0) +
        (headerMap.registration_number != null ? 2 : 0) +
        (headerMap.gender != null ? 1 : 0) +
        (headerMap.biting_animal != null ? 1 : 0)

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          sheetName,
          headerRowIndex: rowIndex,
          headerMap,
          score,
          context,
        }
      }
    }
  })

  return bestMatch
}

function buildHeaderMap(headerRow: unknown[]) {
  const headerMap: Partial<Record<HeaderField, number>> = {}

  headerRow.forEach((cell, columnIndex) => {
    const normalizedHeader = normalizeCellText(cell)
    if (!normalizedHeader) return

    for (const [field, aliases] of Object.entries(HEADER_SYNONYMS) as Array<[HeaderField, string[]]>) {
      if (headerMap[field] != null) continue

      if (aliases.some((alias) => normalizedHeader === alias || normalizedHeader.includes(alias))) {
        headerMap[field] = columnIndex
      }
    }
  })

  return headerMap
}

function extractSheetContext(rows: unknown[][]): SheetContext {
  return {
    municipality: findContextValue(rows, ['municipality', 'city municipality']),
    barangay: findContextValue(rows, ['barangay', 'brgy']),
    physician_charge: findContextValue(rows, ['physician', 'doctor']),
  }
}

function findContextValue(rows: unknown[][], labels: string[]) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 12); rowIndex += 1) {
    const row = rows[rowIndex] || []

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const normalizedCell = normalizeCellText(row[columnIndex])
      if (!normalizedCell) continue

      if (labels.some((label) => normalizedCell === normalizeCellText(label))) {
        for (let nextColumnIndex = columnIndex + 1; nextColumnIndex < Math.min(row.length, columnIndex + 5); nextColumnIndex += 1) {
          const candidate = stringifyCell(row[nextColumnIndex]).trim()
          if (candidate && !labels.some((label) => normalizeCellText(candidate) === normalizeCellText(label))) {
            return candidate
          }
        }
      }
    }
  }

  return ''
}

function getSheetNameBonus(sheetName: string) {
  const normalizedSheetName = normalizeCellText(sheetName)

  if (normalizedSheetName.includes('linelist')) return 4
  if (normalizedSheetName.includes('registry')) return 4
  if (normalizedSheetName.includes('patient')) return 3
  if (normalizedSheetName.includes('import')) return 2
  return 0
}

function mapImportedRow(
  row: unknown[],
  headerMap: Partial<Record<HeaderField, number>>,
  context: SheetContext,
  timestamp: string,
): ImportedAnimalBiteRecord | null {
  const fullName = getMappedCell(row, headerMap.full_name).trim()
  if (!fullName) return null

  const visitDate = parseDateCell(row[headerMap.date_of_visit ?? -1])
  if (!visitDate) return null

  const ageValue = getMappedCell(row, headerMap.age)
  const ageInfo = parseAge(ageValue)

  return {
    registration_number: getMappedCell(row, headerMap.registration_number),
    date_of_visit: visitDate,
    full_name: fullName,
    municipality: getMappedCell(row, headerMap.municipality) || context.municipality,
    barangay: getMappedCell(row, headerMap.barangay) || context.barangay,
    address: '',
    contact_number: '',
    age: ageInfo.age,
    age_in_months: ageInfo.ageInMonths,
    gender: normalizeGender(getMappedCell(row, headerMap.gender)),
    date_of_birth: null,
    philhealth_member: '',
    philhealth_number: '',
    allergies: '',
    immunocompromised_status: '',
    specify_illness: '',
    intake_steroids_chloroquine: false,
    bp: '',
    hr: '',
    rr: '',
    temp: '',
    patient_weight: '',
    biting_animal: normalizeAnimal(getMappedCell(row, headerMap.biting_animal)),
    biting_animal_others: '',
    ownership: '',
    anti_rabies_vaccination: '',
    category: normalizeCategory(getMappedCell(row, headerMap.category)),
    circumstance: '',
    type_of_exposure: normalizeExposure(getMappedCell(row, headerMap.type_of_exposure)),
    date_of_exposure: null,
    place_of_exposure: '',
    human_arv_status: '',
    date_last_vaccination: null,
    bite_site_notes: '',
    washing_bite_wound: false,
    full_regimen: false,
    booster: false,
    vaccine_generic_name: '',
    vaccine_brand_name: '',
    vaccine_route: '',
    day0: null,
    day3: null,
    day7: null,
    day14: null,
    day2128: null,
    animal_status_after_day14: '',
    erig_hrig_computed_dose: '',
    erig_hrig_actual_dose: '',
    erig_hrig_date_given: null,
    tetanus_wound_type: '',
    tetanus_date_last: null,
    tetanus_toxoid: '',
    ats: '',
    diagnosis_notes: '',
    progress_notes: '',
    nurse_in_charge: '',
    physician_charge: getMappedCell(row, headerMap.physician_charge) || context.physician_charge,
    created_at: timestamp,
    updated_at: timestamp,
  }
}

function getMappedCell(row: unknown[], columnIndex?: number) {
  if (columnIndex == null || columnIndex < 0) return ''
  return stringifyCell(row[columnIndex]).trim()
}

function parseDateCell(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value)
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      return formatDate(new Date(parsed.y, parsed.m - 1, parsed.d))
    }
  }

  const textValue = stringifyCell(value).trim()
  if (!textValue) return ''

  const normalizedValue = textValue.replace(/\./g, '/')
  const isoLikeParts = normalizedValue.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (isoLikeParts) {
    const year = Number(isoLikeParts[1])
    const month = Number(isoLikeParts[2]) - 1
    const day = Number(isoLikeParts[3])
    return formatDate(new Date(year, month, day))
  }

  const parsedDate = new Date(normalizedValue)
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDate(parsedDate)
  }

  const parts = normalizedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (parts) {
    const month = Number(parts[1]) - 1
    const day = Number(parts[2])
    const year = Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3])
    return formatDate(new Date(year, month, day))
  }

  return ''
}

function parseAge(value: unknown) {
  const rawAge = stringifyCell(value).trim()
  if (!rawAge) {
    return { age: '', ageInMonths: null }
  }

  const normalizedAge = rawAge.toLowerCase()
  const yearsMatch = normalizedAge.match(/(\d+)\s*(?:y|yr|yrs|year|years)/)
  const monthsMatch = normalizedAge.match(/(\d+)\s*(?:m|mo|mos|month|months)/)

  if (yearsMatch || monthsMatch) {
    const ageInMonths = (Number(yearsMatch?.[1] || 0) * 12) + Number(monthsMatch?.[1] || 0)
    return { age: rawAge, ageInMonths }
  }

  return { age: rawAge, ageInMonths: null }
}

function normalizeGender(value: string) {
  const normalizedValue = normalizeCellText(value)
  if (!normalizedValue) return ''
  if (normalizedValue === 'm' || normalizedValue.startsWith('male')) return 'male'
  if (normalizedValue === 'f' || normalizedValue.startsWith('female')) return 'female'
  return value.trim().toLowerCase()
}

function normalizeAnimal(value: string) {
  const normalizedValue = normalizeCellText(value)
  if (!normalizedValue) return ''
  if (normalizedValue.includes('dog')) return 'dog'
  if (normalizedValue.includes('cat')) return 'cat'
  return 'others'
}

function normalizeCategory(value: string) {
  const normalizedValue = normalizeCellText(value)
  if (!normalizedValue) return ''
  if (normalizedValue.includes('iii') || normalizedValue === '3' || normalizedValue.includes('cat3')) return 'III'
  if (normalizedValue.includes('ii') || normalizedValue === '2' || normalizedValue.includes('cat2')) return 'II'
  if (normalizedValue === 'i' || normalizedValue === '1' || normalizedValue.includes('cat1')) return 'I'
  return value.trim().toUpperCase()
}

function normalizeExposure(value: string) {
  const normalizedValue = normalizeCellText(value)
  if (!normalizedValue) return ''
  if (normalizedValue.includes('nonbite') || (normalizedValue.includes('non') && normalizedValue.includes('bite'))) return 'non_bite'
  if (normalizedValue.includes('bite')) return 'bite'
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function normalizeCellText(value: unknown) {
  return stringifyCell(value)
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
}

function stringifyCell(value: unknown) {
  if (value == null) return ''
  if (value instanceof Date) return formatDate(value)
  return String(value)
}

function isEmptyCell(value: unknown) {
  return !stringifyCell(value).trim()
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
