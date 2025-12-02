# QuizFun Content Manager

Aplicație web pentru generarea, validarea și importul de conținut educațional în platforma QuizFun.app.

## 🚀 Quick Start

### Prerequisite

- Node.js 18+ și npm

### Instalare

```bash
npm install
```

### Configurare

Creează fișierul `.env.local` cu API keys:

```bash
cp .env.local.example .env.local
```

Completează cu:
- `NEXT_PUBLIC_GEMINI_API_KEY` - din [ai.google.dev](https://ai.google.dev)
- Firebase credentials (în faza următoare)

### Rulare

```bash
npm run dev
```

Accesează aplicația la `http://localhost:3000`

## 📋 Structura Proiectului

```
quizfun-content-manager/
├── app/                      # Next.js App Router (pagini)
│   ├── page.tsx             # Dashboard
│   ├── documents/page.tsx   # Gestiune documente
│   ├── generate/page.tsx    # Generare întrebări
│   ├── review/page.tsx      # Validare și editare
│   ├── import/page.tsx      # Import Firestore
│   └── settings/page.tsx    # Configurare API
├── components/              # Componente React
│   └── layout/              # Layout components
├── services/                # Servicii externe
│   ├── gemini.ts           # Integrare Gemini API
│   └── storage.ts          # LocalStorage management
├── lib/                     # Utilitare și constante
│   ├── constants.ts        # Constante (tipuri, dificultăți)
│   ├── validation.ts       # Validare schema JSON
│   └── prompts.ts          # (viitor) Prompturi Gemini
├── types/                   # TypeScript types
│   └── index.ts            # Definiții de tipuri
└── styles/                  # CSS & Tailwind
```

## 🎯 Fluxul Principal

1. **Settings** - Configurează API Key Gemini
2. **Documents** - Încarcă manuale și programe școlare (creează corpus-uri)
3. **Generate** - Lansează generare de întrebări cu AI
4. **Review** - Validează și editează întrebările generate
5. **Import** - Salvează în Firebase Firestore

## 🧬 Tipuri de Itemi Susținuți

- ✅ Alegere multiplă (1 răspuns)
- ✅ Alegere multiplă (răspunsuri multiple)
- ✅ Adevărat/Fals
- ✅ Potrivire (matching)
- ✅ Completare spații (fill in blanks)
- ✅ Ordonare (ordering/sequencing)
- ✅ Categorizare (grouping)
- 🔄 Întrebări structurate (cu AI) - viitor
- 🔄 Eseu structurat (cu AI) - viitor

## 🔐 Securitate

- API keys se salvează în `.env.local` (NU în Git)
- Fiecare utilizator are propriul context localStorage
- Firebase credentials vor fi stocate secure în backend (faza 2)

## 📦 Tehnologii

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **AI API**: Google Gemini 2.0
- **Database**: Firebase Firestore (integrare în faza 2)
- **Icons**: Lucide React

## 📊 Dimensiuni Suportate

- Întrebări: 5-100 per sesiune
- Dificultate: Easy (40%), Medium (40%), Hard (20%)
- Discipline: 11 + extensibil
- Clase: V-XII

## 🛣️ Roadmap MVP (Faza 1)

- [x] Setup Next.js cu TypeScript și Tailwind
- [x] Pagini principale (6 pagini)
- [x] Servicii Gemini API (skeleton)
- [x] Validare schema JSON completă
- [x] LocalStorage management
- [x] UI/UX pentru toate fluxurile
- [ ] Integrare reală cu Gemini File Search API
- [ ] Teste E2E cu Playwright
- [ ] Documentare API interna

## 🔄 Viitoarele Faze

### Faza 2: Integrare Firebase & AI
- Integrare Firebase Admin SDK
- Setup real Gemini File Search
- Evaluare AI pentru itemi subiectivi
- Dashboard profesor

### Faza 3: Optimizări
- Performance optimization
- Caching (Redis)
- Rate limiting
- Analytics

## 📝 Convenții Cod

- Componente funcționale cu hooks
- TypeScript strict
- ESLint + Prettier (opțional)
- Commit messages descriptive

## 🆘 Troubleshooting

### "API Key not configured"
- Verifică `NEXT_PUBLIC_GEMINI_API_KEY` în `.env.local`
- Confirmă că ești pe [ai.google.dev](https://ai.google.dev) cu cont valid

### Port 3000 deja folosit
```bash
npm run dev -- -p 3001
```

### localStorage nu se șterge
```javascript
// În browser console
localStorage.clear()
```

## 📞 Suport

Contactează [Eduard] pentru probleme sau întrebări.

## 📄 Licență

Privat - QuizFun.app

---

**Last Updated**: Decembrie 2025
