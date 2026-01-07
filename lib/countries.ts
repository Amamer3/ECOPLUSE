export const countries = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
]

export function getCountryLabel(code?: string) {
  if (!code) return undefined
  const found = countries.find((c) => c.value === code)
  return found ? found.label : code
}
