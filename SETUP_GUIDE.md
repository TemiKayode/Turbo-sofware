# Turbo Software - Complete Setup Guide

## 🎯 New Features Setup

### 1. Testing Setup ✅

Testing is configured with Vitest and React Testing Library.

**Run tests:**
```bash
npm test
```

**Run tests with UI:**
```bash
npm run test:ui
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Test files location:**
- `src/test/` - Test utilities and setup
- `*.test.tsx` - Component tests

### 2. Dark Mode ✅

Dark mode is fully implemented with system preference detection.

**Features:**
- Light mode
- Dark mode  
- System preference (auto-detect)
- Persistent storage
- Smooth transitions

**Usage:**
- Toggle via theme switcher in header
- Automatically respects system preference
- Saved to localStorage

### 3. PWA Support ✅

Progressive Web App support is configured.

**Features:**
- Installable on mobile and desktop
- Offline support with service worker
- Automatic updates
- Cached API responses

**Setup:**
1. Add PWA icons to `public/` folder:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`
   - `favicon.ico`

2. Build the app - manifest is auto-generated:
```bash
npm run build
```

3. The app will be installable after deployment.

### 4. Sentry Error Tracking ✅

Sentry is integrated for production error monitoring.

**Setup:**
1. Create a Sentry account at https://sentry.io
2. Create a new project (React)
3. Copy your DSN
4. Add to `.env`:
```
VITE_SENTRY_DSN=your-sentry-dsn-here
```

**Features:**
- Automatic error capture
- Performance monitoring
- Session replay
- User context tracking
- Source maps support

**Debug mode (development):**
```
VITE_SENTRY_DEBUG=true
```

### 5. Internationalization (i18n) ✅

Multi-language support is implemented.

**Supported Languages:**
- English (en) - Default
- Spanish (es)
- French (fr)

**Usage in components:**
```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('dashboard.title')}</h1>
}
```

**Adding new languages:**
1. Create `src/i18n/locales/[lang].json`
2. Add translations
3. Import in `src/i18n/config.ts`
4. Add to `LanguageSwitcher` component

**Language files:**
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`
- `src/i18n/locales/fr.json`

## 📝 Environment Variables

Complete `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
VITE_STRIPE_PRICE_BASIC_MONTHLY=price_xxx
VITE_STRIPE_PRICE_BASIC_YEARLY=price_xxx
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxx
VITE_STRIPE_PRICE_PRO_YEARLY=price_xxx
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx

# Security
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
VITE_FINGERPRINTJS_API_KEY=your-fingerprintjs-key

# Error Tracking (Optional)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_DEBUG=false
```

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Run development server:**
```bash
npm run dev
```

4. **Run tests:**
```bash
npm test
```

5. **Build for production:**
```bash
npm run build
```

## 📦 Dependencies Added

### Production
- `@sentry/react` - Error tracking
- `@sentry/browser` - Browser SDK
- `i18next` - Internationalization core
- `react-i18next` - React bindings
- `i18next-browser-languagedetector` - Language detection

### Development
- `vitest` - Test runner
- `@vitest/ui` - Test UI
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction
- `jsdom` - DOM environment for tests
- `@vitest/coverage-v8` - Coverage reports
- `vite-plugin-pwa` - PWA support

## 🎨 Theme System

The theme system uses:
- `ThemeContext` - Theme state management
- `useLocalStorage` - Persistent theme preference
- System preference detection
- CSS variables for theming

## 🌍 i18n System

Translation system:
- Automatic language detection
- localStorage persistence
- Language switcher component
- Namespaced translations

## 🐛 Error Tracking

Sentry integration:
- Automatic error boundaries
- Performance monitoring
- Session replay
- User context
- Environment-based sampling

## 📱 PWA Features

Progressive Web App:
- Service worker for offline support
- App manifest
- Install prompts
- Update notifications
- Cached resources

## ✅ All Features Complete

All requested features have been implemented:
- ✅ Unit/Integration tests
- ✅ Full dark mode
- ✅ PWA support
- ✅ Sentry error tracking
- ✅ i18n support

