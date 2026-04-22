import { AnimalBiteRecord } from '../types'

function clean(value?: string | null) {
  return value?.trim() || ''
}

export function getExposureMunicipality(
  record: Pick<AnimalBiteRecord, 'exposureMunicipality'>,
) {
  return clean(record.exposureMunicipality)
}

export function getExposureBarangay(
  record: Pick<AnimalBiteRecord, 'exposureBarangay'>,
) {
  return clean(record.exposureBarangay)
}

export function getExposureStreet(
  record: Pick<AnimalBiteRecord, 'exposureStreet' | 'placeOfExposure'>,
) {
  return clean(record.exposureStreet) || clean(record.placeOfExposure)
}

export function formatExposureLocation(
  record: Pick<AnimalBiteRecord, 'exposureMunicipality' | 'exposureBarangay' | 'exposureStreet' | 'placeOfExposure'>,
  options: {
    includeStreet?: boolean
    fallback?: string
  } = {},
) {
  const parts: string[] = []
  const street = getExposureStreet(record)
  const barangay = getExposureBarangay(record)
  const municipality = getExposureMunicipality(record)

  if (options.includeStreet && street) parts.push(street)
  if (barangay) parts.push(barangay)
  if (municipality) parts.push(municipality)

  if (parts.length > 0) {
    return parts.join(', ')
  }

  return options.fallback ?? street
}

export function buildLegacyPlaceOfExposure(
  record: Pick<AnimalBiteRecord, 'exposureMunicipality' | 'exposureBarangay' | 'exposureStreet' | 'placeOfExposure'>,
) {
  return formatExposureLocation(record, {
    includeStreet: true,
    fallback: '',
  })
}
