# WashWise

WashWise is a modern Next.js application for managing laundry service delivery, member requests, order tracking, rewards, and support. It provides dedicated admin and member experiences, offline support, push notifications, and API-driven workflows.

## Features

- Admin and member role support
- Order creation, progress tracking, and history
- Address and profile management for members
- Reward and reporting tools for admins
- Support ticket and service workflows
- Offline-ready pages and background sync
- Push notifications with Pusher and Web Push
- Google OAuth and email/password authentication

## Installation

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- MongoDB instance or connection string

### Setup

1. Clone the repository:

```bash
git clone https://github.com/<your-org>/washwise.git
cd wasways
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and copy any example or required variables.

4. Configure environment variables such as:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_URL` (optional)
- `PUSH_PUBLIC_KEY`, `PUSH_PRIVATE_KEY` (optional)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### PWA development mode

```bash
npm run dev:pwa
```

### Production build

```bash
npm run build
npm start
```

## Project Structure

- `app/` — application routes, layouts, and top-level pages
- `app/admin/` — admin dashboard, reports, scheduling, rewards, and management pages
- `app/member/` — member-facing pages for orders, profile, rewards, and support
- `app/api/` — backend API routes for auth, members, admins, services, and system actions
- `components/` — shared UI components and widgets
- `hooks/` — custom React hooks for data fetching and UI state
- `lib/` — reusable utilities, service wrappers, and integration helpers
- `config/` — static data, layout utilities, and mock content
- `types/` — shared TypeScript definitions
- `public/` — static assets, service worker, and client resources

## User Roles Guide

### Admin

Admins manage the platform and respond to member needs.

Typical capabilities:

- View dashboards and usage metrics
- Manage activities, schedules, and services
- Review and handle support requests
- Manage users and membership access
- Oversee rewards and reporting

Common admin routes:

- `/admin/dashboard`
- `/admin/report`
- `/admin/scheduling`
- `/admin/services`
- `/admin/support`
- `/admin/user-management`

### Member

Members are customers who place orders and manage their account.

Typical capabilities:

- Submit and track laundry orders
- Manage saved addresses and profile details
- View reward balances and redeem offers
- Contact support and review order progress

Common member routes:

- `/member/dashboard`
- `/member/new-order`
- `/member/my-orders`
- `/member/profile`
- `/member/rewards`
- `/member/support`

### Guest / Public

Public users can access general information and onboarding pages:

- Home page
- Offline page
- Privacy policy
- Terms of service

## Deployment

1. Build the app:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

3. Deploy to your chosen hosting platform. Ensure environment variables are configured on the production host.

## Notes

- This project uses Next.js 16 with the App Router and React 19.
- UI is built with Material UI and Emotion.
- Offline and push features require proper service worker and web-push configuration.

## Contributing

- Use `npm run lint` to validate code quality.
- Follow existing folder conventions for pages, hooks, and API routes.
- Add new environment variables to `.env.example` if needed.

## License

This repository is private. Add a license section if the project becomes open source.
