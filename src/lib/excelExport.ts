import * as XLSX from 'xlsx'
import { AnimalBiteRecord, ageGroup } from '../types'

/**
 * Exports animal bite records into a formatted Excel report
 * matching the official Municipal Animal Bite and Rabies Report Form template.
 */
export function exportToExcel(records: AnimalBiteRecord[], monthYear: string) {
  const wb = XLSX.utils.book_new()

  // ── Header rows ──────────────────────────────────────────────────────────────
  const headers = [
    [
      'MUNICIPAL ANIMAL BITE AND RABIES REPORT',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    ],
    [
      `Reporting Period: ${monthYear}`,
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    ],
    [],
    [
      'No.',
      'Date',
      'Reg. No.',
      'Full Name',
      'Age',
      'Gender',
      'Address',
      'Biting Animal',
      'Ownership',
      'Category',
      'Circumstance',
      'Type of Exposure',
      'Date of Exposure',
      'Place of Exposure',
      'ARV Status',
      'Human ARV',
      'Washing',
      'Full Regimen',
      'Booster',
      'Vaccine Generic',
      'Vaccine Brand',
      'Route',
      'Day 0',
      'Day 3',
      'Day 7',
      'Day 14',
      'Day 21/28',
      'Age Group',
      'Animal Status Day14',
      'ERIG/HRIG Computed',
      'ERIG/HRIG Actual',
      'ERIG/HRIG Date',
      'Tetanus Wound',
      'Tetanus Last Date',
      'Tetanus Toxoid',
      'ATS',
      'BP',
      'HR',
      'RR',
      'Temp',
      'Weight',
      'Diagnosis Notes',
      'Nurse',
      'Physician',
    ],
  ]

  // ── Data rows ────────────────────────────────────────────────────────────────
  const dataRows = records.map((r, i) => [
    i + 1,
    r.dateOfVisit || '',
    r.registrationNumber || '',
    r.fullName || '',
    r.age || '',
    r.gender ? r.gender.charAt(0).toUpperCase() : '',
    r.address || '',
    r.bitingAnimal === 'others' ? `Others: ${r.bitingAnimalOthers || ''}` : (r.bitingAnimal || '').toUpperCase(),
    (r.ownership || '').toUpperCase(),
    r.category || '',
    (r.circumstance || '').toUpperCase(),
    (r.typeOfExposure || '').replace('_', ' ').toUpperCase(),
    r.dateOfExposure || '',
    r.placeOfExposure || '',
    r.antiRabiesVaccination === 'with_vaccination' ? 'Vaccinated' : (r.antiRabiesVaccination === 'none' ? 'None' : ''),
    r.humanArvStatus === 'complete' ? 'Complete' : r.humanArvStatus === 'incomplete' ? 'Incomplete' : r.humanArvStatus === 'none' ? 'None' : '',
    r.washingBiteWound ? 'Yes' : 'No',
    r.fullRegimen ? 'Yes' : 'No',
    r.booster ? 'Yes' : 'No',
    r.vaccineGenericName || '',
    r.vaccineBrandName || '',
    (r.vaccineRoute || '').toUpperCase(),
    r.day0 || '',
    r.day3 || '',
    r.day7 || '',
    r.day14 || '',
    r.day2128 || '',
    r.ageInMonths != null ? ageGroup(r.ageInMonths) : '',
    (r.animalStatusAfterDay14 || '').toUpperCase(),
    r.erigHrigComputedDose || '',
    r.erigHrigActualDose || '',
    r.erigHrigDateGiven || '',
    (r.tetanusWoundType || '').toUpperCase(),
    r.tetanusDateLast || '',
    r.tetanusToxoid || '',
    r.ats || '',
    r.bp || '',
    r.hr || '',
    r.rr || '',
    r.temp || '',
    r.patientWeight || '',
    r.diagnosisNotes || '',
    r.nurseInCharge || '',
    r.physicianCharge || '',
  ])

  const allRows = [...headers, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(allRows)

  // ── Column widths ─────────────────────────────────────────────────────────────
  ws['!cols'] = [
    { wch: 5 },   // No.
    { wch: 12 },  // Date
    { wch: 12 },  // Reg No.
    { wch: 24 },  // Full Name
    { wch: 5 },   // Age
    { wch: 7 },   // Gender
    { wch: 24 },  // Address
    { wch: 12 },  // Biting Animal
    { wch: 10 },  // Ownership
    { wch: 10 },  // Category
    { wch: 12 },  // Circumstance
    { wch: 14 },  // Exposure Type
    { wch: 12 },  // Date Exposure
    { wch: 18 },  // Place Exposure
    { wch: 14 },  // ARV Status
    { wch: 14 },  // Human ARV
    { wch: 9 },   // Washing
    { wch: 12 },  // Full Regimen
    { wch: 9 },   // Booster
    { wch: 16 },  // Generic
    { wch: 16 },  // Brand
    { wch: 8 },   // Route
    { wch: 12 },  // Day 0-21
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },  // Animal Status
    { wch: 16 },  // ERIG/HRIG Computed
    { wch: 16 },  // ERIG/HRIG Actual
    { wch: 14 },  // ERIG/HRIG Date
    { wch: 12 },  // Tetanus wound
    { wch: 16 },  // Tetanus date
    { wch: 14 },  // Tetanus toxoid
    { wch: 8 },   // ATS
    { wch: 8 },   // BP
    { wch: 8 },   // HR
    { wch: 8 },   // RR
    { wch: 8 },   // Temp
    { wch: 8 },   // Weight
    { wch: 30 },  // Diagnosis
    { wch: 18 },  // Nurse
    { wch: 18 },  // Physician
  ]

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 42 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 42 } },
  ]

  // Style title rows (bold, centered)
  const titleCell = ws['A1']
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' },
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Animal Bite Report')

  // ── Summary Sheet ─────────────────────────────────────────────────────────────
  const summaryData = buildSummary(records, monthYear)
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 30 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

  // Download
  const filename = `AnimalBiteReport_${monthYear.replace(/\s/g, '_')}_${Date.now()}.xlsx`
  XLSX.writeFile(wb, filename)
}

function buildSummary(records: AnimalBiteRecord[], monthYear: string): (string | number)[][] {
  const total = records.length
  const male = records.filter(r => r.gender === 'male').length
  const female = records.filter(r => r.gender === 'female').length
  const dog = records.filter(r => r.bitingAnimal === 'dog').length
  const cat = records.filter(r => r.bitingAnimal === 'cat').length
  const others = records.filter(r => r.bitingAnimal === 'others').length
  const owned = records.filter(r => r.ownership === 'owned').length
  const stray = records.filter(r => r.ownership === 'stray').length
  const catI = records.filter(r => r.category === 'I').length
  const catII = records.filter(r => r.category === 'II').length
  const catIII = records.filter(r => r.category === 'III').length
  const provoked = records.filter(r => r.circumstance === 'provoked').length
  const unprovoked = records.filter(r => r.circumstance === 'unprovoked').length
  const bite = records.filter(r => r.typeOfExposure === 'bite').length
  const nonBite = records.filter(r => r.typeOfExposure === 'non_bite').length
  const washed = records.filter(r => r.washingBiteWound).length
  const fullRegimen = records.filter(r => r.fullRegimen).length
  const booster = records.filter(r => r.booster).length
  const alive = records.filter(r => r.animalStatusAfterDay14 === 'alive').length
  const dead = records.filter(r => r.animalStatusAfterDay14 === 'dead').length
  const lost = records.filter(r => r.animalStatusAfterDay14 === 'lost').length

  // Age groups (DOH standard)
  const ageUnder1 = records.filter(r => r.ageInMonths != null && r.ageInMonths < 12).length
  const age1to4 = records.filter(r => r.ageInMonths != null && r.ageInMonths >= 12 && r.ageInMonths < 60).length
  const age5to13 = records.filter(r => r.ageInMonths != null && r.ageInMonths >= 60 && r.ageInMonths < 168).length
  const age14plus = records.filter(r => r.ageInMonths != null && r.ageInMonths >= 168).length
  const ageUnknown = records.filter(r => r.ageInMonths == null).length

  return [
    [`MUNICIPAL ANIMAL BITE AND RABIES REPORT — SUMMARY`],
    [`Reporting Period: ${monthYear}`],
    [],
    ['Indicator', 'Count'],
    ['TOTAL CASES', total],
    [],
    ['By Age Group (DOH Standard)', ''],
    ['< 1 year', ageUnder1],
    ['1 – 4 years', age1to4],
    ['5 – 13 years', age5to13],
    ['≥ 14 years', age14plus],
    ['Age Unknown', ageUnknown],
    [],
    ['By Gender', ''],
    ['Male', male],
    ['Female', female],
    [],
    ['By Biting Animal', ''],
    ['Dog', dog],
    ['Cat', cat],
    ['Others', others],
    [],
    ['By Ownership', ''],
    ['Owned', owned],
    ['Stray', stray],
    [],
    ['By Category', ''],
    ['Category I', catI],
    ['Category II', catII],
    ['Category III', catIII],
    [],
    ['By Circumstance', ''],
    ['Provoked', provoked],
    ['Unprovoked', unprovoked],
    [],
    ['By Type of Exposure', ''],
    ['Bite', bite],
    ['Non-Bite', nonBite],
    [],
    ['Wound Treatment', ''],
    ['Wound Washed', washed],
    ['Full Regimen Given', fullRegimen],
    ['Booster Given', booster],
    [],
    ['Animal Status after Day 14', ''],
    ['Alive', alive],
    ['Dead', dead],
    ['Lost', lost],
  ]
}
