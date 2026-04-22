# ระบบคุณแฟน - UniformFlow

ระบบจัดการคำสั่งงานผลิตชุดยูนิฟอร์ม

## Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Firebase (Firestore, Storage, Auth, Functions)
- **Hosting:** Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd UniformFlow
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
- Copy `.env.example` to `.env.local`
- Fill in your Firebase configuration
- Create Firebase project at https://console.firebase.google.com
- Enable Firestore, Storage, and Authentication

4. Run development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
UniformFlow/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Authentication routes
│   │   ├── (mobile)/     # Mobile-first views
│   │   ├── (desktop)/    # Desktop dashboard
│   │   └── api/          # API routes
│   ├── components/       # Reusable components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── mobile/      # Mobile-specific components
│   │   └── desktop/     # Desktop-specific components
│   ├── lib/             # Utilities
│   ├── types/           # TypeScript types
│   └── hooks/           # Custom React hooks
├── firebase/            # Firebase configuration
│   ├── functions/      # Cloud Functions
│   ├── firestore.rules
│   └── storage.rules
└── public/              # Static assets
```

## Features

- **Mobile-First Design:** Optimized for mobile devices
- **Responsive Dashboard:** Desktop-friendly admin interface
- **Real-time Updates:** Firestore real-time sync
- **Image Upload:** Firebase Storage integration
- **Authentication:** Firebase Auth (Email/Password)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run firebase:deploy` - Deploy to Firebase

### Firebase Deployment

1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

2. Login to Firebase
```bash
firebase login
```

3. Initialize Firebase (if not already done)
```bash
firebase init
```

4. Deploy
```bash
npm run firebase:deploy
```

## License

Copyright © 2026
