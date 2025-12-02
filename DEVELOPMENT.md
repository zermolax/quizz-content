# QuizFun Content Manager - Development Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Next.js App Router              │
│    (Pages, API Routes, Components)      │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌─────▼────┐
    │Services│          │Components│
    │────────│          │──────────│
    │• Gemini│          │• Layout  │
    │• Storage        │• Forms   │
    └────┬───┘          │• Cards   │
         │              └──────────┘
    ┌────▼─────────┐
    │Libraries     │
    │─────────────│
    │• Validation │
    │• Prompts    │
    │• Constants  │
    │• Types      │
    └──────────────┘
```

## 📂 File Structure Details

### `/app` - Pages (Next.js App Router)

- **page.tsx** - Dashboard with stats and quick actions
- **documents/page.tsx** - Corpus management and PDF upload
- **generate/page.tsx** - Question generation workflow (core feature)
- **review/page.tsx** - Validation, filtering, inline editing
- **import/page.tsx** - Pre-import summary and Firebase integration
- **settings/page.tsx** - API key configuration
- **layout.tsx** - Root layout with metadata
- **globals.css** - Tailwind imports and global styles

### `/components`

- **layout/**
  - `Sidebar.tsx` - Navigation with active route detection
  - `Header.tsx` - Page header with breadcrumbs

### `/services`

- **gemini.ts** - Google Generative AI integration
  - `initializeGemini()` - Client initialization
  - `generateQuestionsWithGemini()` - Main question generation
  - `uploadDocumentToCorpus()` - File upload handler
  - `testGeminiConnection()` - API health check
  - TODO: Gemini File Search API implementation

- **storage.ts** - LocalStorage management
  - Session management (save, get, update, delete)
  - Corpus management
  - JSON export/import
  - Session persistence

### `/lib`

- **constants.ts** - Application constants
  - Question types and descriptions
  - Bloom levels taxonomy
  - Difficulty configurations
  - Subject and grade definitions
  - Objective vs subjective items

- **validation.ts** - JSON Schema validation
  - `validateQuestion()` - Single question validation
  - `validateTypeSpecific()` - Per-type schema checks
  - `getValidationSummary()` - Batch statistics

- **prompts.ts** - Gemini prompt templates
  - `buildGenerationPrompt()` - Main prompt for question generation
  - `buildUnitExtractionPrompt()` - Extract curriculum units
  - `buildCompetencyExtractionPrompt()` - Extract learning competencies
  - `buildValidationPrompt()` - Pedagogical validation
  - `buildEvaluationPrompt()` - AI-based answer evaluation
  - `getRecommendedQuestionTypesForSubject()` - Subject-specific types

### `/types`

- **index.ts** - Complete TypeScript definitions
  - Base question structure
  - Per-type question interfaces
  - Union types for all question types
  - Storage and API types
  - Validation types

## 🔄 Main Workflows

### 1. Question Generation Flow

```
Settings → Documents → Generate → Review → Import
   ↓           ↓          ↓         ↓       ↓
Set API    Manage      Run AI    Validate  Save to
Keys       PDFs      Generation  & Edit   Firebase
```

### 2. Generation Page Workflow

```
Input Context
├─ Subject, Grade, Unit, Topic
│
Select Item Types
├─ Choose from 7-9 types
│
Distribute Difficulty
├─ Easy (40%), Medium (40%), Hard (20%)
│
Generate
├─ Call Gemini API
├─ Validate JSON schema
├─ Save to localStorage
│
Display Results
└─ Show statistics, errors
```

### 3. Review Page Workflow

```
Load Session
├─ Get from localStorage
│
Display Questions
├─ Cards with validation status
├─ Color-coded by validity
│
Operations
├─ Edit inline
├─ Delete single/bulk
├─ Filter by difficulty/type
│
Export/Import
├─ JSON backup
└─ Ready for Firestore import
```

## 🔐 Data Flow

### Client-Side (MVP Phase)

```
┌──────────────────┐
│   Browser        │
├──────────────────┤
│ localStorage     │
│  ├─ Questions   │
│  ├─ Corpus      │
│  └─ Sessions    │
└──────────────────┘
         ↕
    ┌─────────┐
    │ Gemini  │
    │   API   │
    └─────────┘
```

### Server-Side (Future - Phase 2)

```
┌──────────────┐
│  Next.js     │
│  API Routes  │
├──────────────┤
│ Firebase     │
│  Admin SDK   │
└──────────────┘
     ↕
┌──────────────┐
│  Firestore   │
│   Database   │
└──────────────┘
```

## 🧪 Testing Checklist

### Manual Testing

- [ ] Dashboard loads with empty state
- [ ] Settings: Configure API key, test connection
- [ ] Documents: Create corpus, upload file, list documents
- [ ] Generate:
  - [ ] Form validation works
  - [ ] Generation progress shows
  - [ ] Results display with stats
  - [ ] Can navigate to review
- [ ] Review:
  - [ ] Questions display correctly
  - [ ] Validation status shown
  - [ ] Edit mode works
  - [ ] Delete single/bulk works
  - [ ] Filters work (difficulty, type)
  - [ ] Export JSON works
- [ ] Import:
  - [ ] Pre-import summary correct
  - [ ] Can mock-import questions
  - [ ] Raw JSON display works

### Browser DevTools

- [ ] LocalStorage accessible
- [ ] No console errors
- [ ] Network tab shows API calls
- [ ] Responsive on mobile

## 🚀 Next Steps (Phase 2)

### Immediate Priorities

1. **Gemini File Search API Integration**
   - Implement actual corpus creation
   - Implement document upload
   - Test RAG (Retrieval-Augmented Generation)
   - Test with real curriculum PDFs

2. **Firebase Integration**
   - Setup Firebase Admin SDK
   - Create Firestore collections
   - Implement real import function
   - Add authentication (optional for MVP admin)

3. **Testing & Quality**
   - Unit tests for validation
   - Integration tests for API calls
   - E2E tests with Playwright
   - Performance testing (batch imports)

### Medium-term Enhancements

1. **AI-Based Item Evaluation**
   - Implement structured_questions type
   - Implement structured_essay type
   - Build evaluation rubrics
   - Setup async evaluation queue

2. **Teacher Dashboard**
   - View imported questions
   - Statistics per theme
   - Coverage analysis
   - Suggestion engine for remediation

3. **Multi-user Support**
   - Basic authentication
   - Session isolation
   - Audit logging
   - Bulk operations

## 📋 Commit History

```
390e181 feat: Add comprehensive prompt management and enhance Gemini service
18c47df feat: Complete MVP with all main pages and flows
b59f3ff chore: Initialize Next.js project with base architecture
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code (when Prettier added)
npm run format
```

## 💾 Environment Variables

### Required

```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

### Optional (Future)

```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY=your_key_with_escaped_newlines
```

## 🐛 Common Issues & Solutions

### Issue: "API Key not configured"

**Solution:**
1. Go to Settings page
2. Paste your Gemini API key
3. Click Save
4. Test connection

### Issue: Questions not saving to localStorage

**Solution:**
1. Check browser's localStorage is enabled
2. Clear localStorage: `localStorage.clear()`
3. Try generating again

### Issue: Validation errors on generated questions

**Solution:**
1. Review the error messages
2. Edit the question inline (click Edit button)
3. Fix the issue and save
4. Or delete and regenerate

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Google Generative AI](https://ai.google.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Lucide Icons](https://lucide.dev)

## 🤝 Collaboration Notes

- Branch naming: `claude/feature-name-SESSION_ID`
- Commits follow conventional commits
- All changes type-checked before push
- Focus on clarity and maintainability

---

**Last Updated:** December 2025
**Maintained by:** Claude
**Status:** MVP - Ready for Phase 2 Integration
