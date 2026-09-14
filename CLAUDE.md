# Fitnex — Claude Context

Working directory: `/Users/tife/app/fitnex/fit`

## Stack

- **React 19** + TypeScript + Vite
- **Routing:** MemoryRouter (React Router v6) — bottom nav hidden on `/workout/current`, `/workout/summary` is full-screen
- **State:** Zustand 5 (immer + persist) for in-progress workout + guest history; React Context for auth & preferences; Supabase for cloud data
- **Styling:** Tailwind CSS 3 + inline styles (brand color `#10B981`)
- **Animation:** Framer Motion 12 — all variants in `src/animations/fitnex.variants.ts`
- **Icons:** Lucide React — no emoji anywhere in the UI (fully replaced)
- **Charts:** Recharts
- **Image export:** html2canvas
- **Dates:** date-fns + dayjs
- **Backend:** Supabase 2 (auth, postgres, storage)

## Auth modes

Defined in `src/hooks/useAuth.ts` as `AuthMode`:
```
loading | splash | quiz | signup | signin | forgot-password | reset-password | guest | authenticated
```
`quiz` → shows `OnboardingQuiz` before signup. Quiz answers saved to localStorage as `fitnex_quiz_answers`, upserted to `profiles` on signup.

Context: `src/context/AuthContext.tsx`

## Key files

| File | Purpose |
|------|---------|
| `src/hooks/useAuth.ts` | Auth logic, `ProfileData` type (includes 5 quiz columns) |
| `src/lib/supabase.ts` | Supabase client + `Profile` type |
| `src/context/AuthContext.tsx` | Auth context + `setMode`, `continueAsGuest` |
| `src/context/PreferencesContext.tsx` | darkMode, weightUnit, restTimer, reminders |
| `src/services/` | `exerciseService`, `setService`, `workoutService` |
| `src/utils/badges.ts` | Badge definitions (Lucide icon components, not emoji) |
| `src/animations/fitnex.variants.ts` | All Framer Motion variants |
| `src/components/OnboardingQuiz.tsx` | 5-step quiz, mobile + desktop split layout |
| `src/components/CalendarShareCard.tsx` | Streak share card with html2canvas export |
| `src/components/general/WorkoutShareCard.tsx` | Per-workout share card |

## Supabase profile columns

Standard columns plus these quiz fields (all `text | null`):
- `quiz_goal`, `quiz_frequency`, `quiz_equipment`, `quiz_experience`, `quiz_challenge`

## Desktop layout pattern

All screens use `useMediaQuery('(min-width: 768px)')` (or 1024px for some). Standard pattern:
```tsx
const isDesktop = useMediaQuery('(min-width: 768px)')
<div style={{
  minHeight: '100dvh',
  background: darkMode ? '#0a0a0a' : '#f8f9fa',
  display: 'flex',
  flexDirection: 'column',
  alignItems: isDesktop ? 'center' : 'stretch',
  padding: isDesktop ? '40px 24px' : '0',
}}>
  <div style={{ width: '100%', maxWidth: isDesktop ? 680 : '100%' }}>
    {/* content */}
  </div>
</div>
```

## Image / asset conventions

- Vite-bundled assets: `src/assets/` (imported via `import x from '@/assets/...'`)
- Static public files: `public/` (served at root URL — e.g. `/quiz/quiz-goal.png`)
- Quiz images live in `public/quiz/quiz-*.png`
- Splash hero: `src/assets/images/splash-hero.webp` (import as `.webp`, not `.png`)

## html2canvas / share card notes

**Photo backgrounds must use base64 data URLs, not blob URLs.** Blob URLs fail in Safari/some Chrome versions.

```ts
const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    setBgPhotoUrl(event.target?.result as string) // base64
    setBgType('photo')
  }
  reader.readAsDataURL(file)
}

// html2canvas options for photo bg:
html2canvas(cardRef.current, {
  scale: 3,
  backgroundColor: null,
  useCORS: true,
  allowTaint: false,
  logging: false,
  imageTimeout: 0,
})
```

Cleanup effect — only revoke blob URLs:
```ts
useEffect(() => {
  return () => {
    if (bgPhotoUrl?.startsWith('blob:')) URL.revokeObjectURL(bgPhotoUrl)
  }
}, [bgPhotoUrl])
```

## Known issues / tech debt

- 1RM formula breaks if reps >= 37 (Brzycki division by zero) — guarded with a null return in `setService.ts`, not actually fixed
- Long files: Profile (~1149 lines), CurrentWorkout (~995 lines)
- Guest workouts not migrated to cloud on signup

## Pending work (last left off)

Photo background export fix and WorkoutSummary desktop layout are DONE (see git history). Nothing currently pending.

## Build

```bash
npm run dev      # dev server
npm run build    # tsc + vite build (chunks: vendor / motion / supabase / index)
npm run preview  # preview dist
```
