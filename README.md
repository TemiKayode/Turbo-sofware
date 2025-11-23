# Turbo Software

A comprehensive full-stack SaaS application built with React, TypeScript, Supabase, and Stripe.

## 🚀 Features

- ✅ User authentication and authorization with role-based access control
- ✅ Company management with subscription limits
- ✅ Document management with legal acceptance
- ✅ Stripe integration for payments and subscriptions
- ✅ Invoice management
- ✅ Data breach dashboard for regulatory compliance
- ✅ Encrypted sensitive data storage
- ✅ Automated backup system
- ✅ Security logging and audit trails
- ✅ Subscription tier management (Free, Basic, Professional, Enterprise)
- ✅ Comprehensive ERP system with multiple modules
- ✅ **Dark Mode** - Full theme support with system preference detection
- ✅ **PWA Support** - Installable app with offline capabilities
- ✅ **Error Tracking** - Sentry integration for production monitoring
- ✅ **Internationalization** - Multi-language support (English, Spanish, French)
- ✅ **Testing** - Unit and integration tests with Vitest

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **React Query** - Data fetching and caching
- **React Router** - Routing
- **i18next** - Internationalization

### Backend
- **Supabase** - PostgreSQL database with Row-Level Security
- **Supabase Storage** - File storage with security policies
- **22 Deno Edge Functions** - Serverless backend functions

### Integrations
- **Stripe** - Payment processing and subscriptions
- **Resend** - Email notifications
- **FingerprintJS** - Security and fraud detection
- **Sentry** - Error tracking and monitoring

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Resend account (optional)
- FingerprintJS account (optional)
- Sentry account (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd turbo-software
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` and price IDs
- `VITE_ENCRYPTION_KEY` (32 characters)
- `VITE_FINGERPRINTJS_API_KEY` (optional)
- `VITE_SENTRY_DSN` (optional)

4. Set up Supabase:
   - Create a new Supabase project
   - Run migrations from `supabase/migrations/`
   - Create storage bucket named `documents`
   - Set up Edge Functions environment variables

5. Start development server:
```bash
npm run dev
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🌐 Internationalization

The app supports multiple languages:
- English (en) - Default
- Spanish (es)
- French (fr)

Language can be changed via the language switcher in the header.

## 🎨 Dark Mode

Dark mode is fully supported with three options:
- Light mode
- Dark mode
- System preference (follows OS setting)

Toggle via the theme switcher in the header.

## 📱 PWA Support

The app is installable as a Progressive Web App:
- Works offline with service worker
- Installable on mobile and desktop
- Automatic updates

## 🐛 Error Tracking

Sentry is integrated for production error tracking:
- Automatic error capture
- Performance monitoring
- Session replay
- User context tracking

Set `VITE_SENTRY_DSN` in your environment variables to enable.

## 📚 Project Structure

```
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Radix UI components
│   │   └── ...
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── i18n/            # Internationalization
│   ├── lib/             # Utilities and configurations
│   ├── pages/           # Page components
│   ├── test/            # Test utilities and setup
│   └── ...
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify/Vercel

1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

## 📄 License

MIT

## 🤝 Support

For issues and questions, please open an issue in the repository.
