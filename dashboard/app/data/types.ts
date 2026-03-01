export type FloodData = {
  region: string
  flood_area: number
  risk: string
  population: number
  change?: string
  lat: number
  lng: number
  coordinates?: number[][][][]
  trend?: { day: string; flood: number }[]
  reasons?: string[]
  elevation_m?: number
  exposed_builtup_km2?: number
}
