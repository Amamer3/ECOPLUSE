"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { countries } from "@/lib/countries"

function CountrySelectorContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams?.get("country") || "US"
  const [value, setValue] = useState(current)

  useEffect(() => {
    setValue(current)
  }, [current])

  const onChange = (val: string) => {
    const params = new URLSearchParams(Array.from(searchParams?.entries() || []))
    params.set("country", val)
    router.replace(pathname + "?" + params.toString())
  }

  return (
    <div className="px-2 py-2">
      <label className="sr-only">Select country</label>
      <Select value={value} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CountrySelector() {
  return (
    <Suspense fallback={<div className="px-2 py-2 w-40 h-10 bg-muted rounded" />}>
      <CountrySelectorContent />
    </Suspense>
  )
}
