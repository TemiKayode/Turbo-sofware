# Turbo Software

A comprehensive full-stack SaaS application built with React, TypeScript, Supabase, and Stripe.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives

### Backend
- **Supabase** - PostgreSQL database with Row-Level Security
- **Supabase Storage** - File storage with security policies
- **22 Deno Edge Functions** - Serverless backend functions

### Integrations
- **Stripe** - Payment processing and subscriptions
- **Resend** - Email notifications
- **FingerprintJS** - Security and fraud detection

## Features

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

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Resend account (optional)
- FingerprintJS account (optional)

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
- Supabase URL and keys
- Stripe publishable key and price IDs
- Encryption key (32 characters)
- FingerprintJS API key (optional)

4. Set up Supabase:

   a. Create a new Supabase project
   
   b. Run the migration:
   ```bash
   supabase db push
   ```
   
   Or manually run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor

   c. Create storage bucket named `documents` with public access disabled

   d. Set up Edge Functions environment variables in Supabase Dashboard:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENCRYPTION_KEY`

5. Deploy Edge Functions:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-payment-intent
# ... deploy all 22 functions
```

6. Set up Stripe Webhook:
   - In Stripe Dashboard, create a webhook endpoint pointing to your `stripe-webhook` function
   - Subscribe to events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

7. Start development server:
```bash
npm run dev
```

## Project Structure

```
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Radix UI components
│   │   └── Layout.tsx   # Main layout
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/             # Utilities and configurations
│   │   ├── supabase.ts
│   │   ├── stripe.ts
│   │   ├── encryption.ts
│   │   └── fingerprint.ts
│   ├── pages/           # Page components
│   └── App.tsx
├── supabase/
│   ├── functions/       # 22 Deno Edge Functions
│   └── migrations/      # Database migrations
└── public/
```

## Edge Functions

The application includes 22 Deno Edge Functions:

1. `create-checkout-session` - Create Stripe checkout session
2. `stripe-webhook` - Handle Stripe webhooks
3. `create-payment-intent` - Create payment intent for invoices
4. `send-email` - Send emails via Resend
5. `create-backup` - Create data backup
6. `validate-subscription` - Validate subscription limits
7. `encrypt-data` - Encrypt sensitive data
8. `decrypt-data` - Decrypt sensitive data
9. `get-user-permissions` - Get user permissions
10. `update-subscription` - Update subscription
11. `cancel-subscription` - Cancel subscription
12. `list-invoices` - List Stripe invoices
13. `validate-document-access` - Validate document access
14. `get-storage-url` - Get signed storage URL
15. `audit-log` - Log security events
16. `calculate-pricing` - Calculate subscription pricing
17. `verify-legal-document` - Verify legal document acceptance
18. `get-backup-status` - Get backup status
19. `restore-backup` - Restore from backup
20. `get-data-breach-stats` - Get data breach statistics
21. `export-compliance-report` - Export compliance report
22. `process-webhook-resend` - Process webhooks and send emails
23. `validate-backup-integrity` - Validate backup integrity

## Security Features

- **Row-Level Security (RLS)** - Database-level access control
- **Encryption** - AES encryption for sensitive personnel data
- **FingerprintJS** - Device fingerprinting for security
- **Audit Logging** - Comprehensive security event logging
- **Secure Storage** - Supabase Storage with access policies

## Subscription Tiers

- **Free**: 1 user, 1 company, 10 documents
- **Basic**: 5 users, 3 companies, 100 documents - $29/month
- **Professional**: 25 users, 10 companies, 1000 documents - $99/month
- **Enterprise**: 100 users, 50 companies, 10,000 documents - $299/month

## Deployment

### Test Environment

1. Deploy to Vercel/Netlify or similar
2. Set up Supabase test project
3. Configure environment variables
4. Deploy Edge Functions

### Production Environment

1. Set up Cloudflare proxy (optional)
2. Deploy to production hosting
3. Configure production Supabase project
4. Set up production Stripe account
5. Configure domain and SSL

## Testing

- Validate user registration and authentication
- Test subscription creation and management
- Verify Stripe webhook handling
- Test document upload and legal acceptance
- Validate encryption/decryption
- Test backup creation and restoration
- Verify data breach dashboard functionality

## License

MIT

## Support

For issues and questions, please open an issue in the repository.

