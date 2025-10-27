"use client"

import { Globe } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage, type Language } from "@/lib/i18n/language-context"

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇬🇧</span>
            <span>English</span>
          </div>
        </SelectItem>
        <SelectItem value="nl">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇳🇱</span>
            <span>Nederlands</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
