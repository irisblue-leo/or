import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'zh-CN' | 'zh-TW' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh-CN',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'openclaw-relay-language',
    }
  )
)
