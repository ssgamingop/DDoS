export type FloodData = {
  region: string
  flood_area: number
  risk: string
  population: number
  change?: string
  lat: number
  lng: number
  coordinates?: number[][]
  trend?: { day: string; flood: number }[]
}

export const mockData: FloodData = {
  region: "Mumbai",
  flood_area: 120,
  risk: "High",
  population: 24000,
  change: "+40 km²",
  lat: 19.0760,
  lng: 72.8777,
  coordinates: [
    [72.87, 19.07],
    [72.88, 19.06],
    [72.89, 19.08],
    [72.86, 19.08],
    [72.87, 19.07]
  ],
  trend: [
    { day: "Mon", flood: 20 },
    { day: "Tue", flood: 40 },
    { day: "Wed", flood: 60 },
    { day: "Thu", flood: 30 },
    { day: "Fri", flood: 80 }
  ]
}
