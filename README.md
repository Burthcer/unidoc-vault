# UniDoc Vault

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

A client-side document vault for regional university admissions. UniDoc Vault compresses mark sheets and ID cards to fit strict upload limits (e.g. 50KB) entirely in the browser, with Web Crypto encryption and no server-side storage.

## Overview

Application portals for university admissions often cap uploads at a few tens of kilobytes — far smaller than a typical scanned document or phone photo. UniDoc Vault handles the resize/compress/encrypt pipeline client-side using the Canvas and Web Crypto APIs, so files never leave the browser unencrypted and no document data touches a server.

## Project Layout

```
unidoc-vault/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Landing page
│   ├── dashboard/        # Authenticated document dashboard
│   └── learn-more/       # Product explainer page
├── components/
│   ├── FileCompressor.tsx  # Core compression UI/flow
│   ├── AuthModal.tsx       # Auth entry point
│   └── Navbar.tsx
├── lib/
│   ├── crypto.ts          # Web Crypto encryption helpers
│   ├── AuthContext.tsx     # Auth state
│   └── VaultContext.tsx    # Document vault state
└── public/
```

## Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

## Installation

```bash
git clone https://github.com/Burthcer/unidoc-vault.git
cd unidoc-vault
npm install
```

## Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## License

MIT — see [LICENSE](LICENSE).
