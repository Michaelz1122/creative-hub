# Creative Hub

Creative Hub is being rebuilt as an Egyptian-first guided learning platform for creative and digital careers.

This repository is intentionally starting from a cleaner architecture instead of patching the old codebase in place. The old repository remains a reference source for reusable logic and product lessons, while this repository becomes the new product foundation.

## Current Scope

- Premium Arabic-first marketing site
- Clear dashboard-first product architecture
- Track-based roadmap system
- Typed Prisma schema for payments, memberships, permissions, roadmap, quizzes, and content
- Admin control-center foundations

## Local Setup

```powershell
npm install
cp .env.example .env
npm run dev
```

## Architecture Notes

See [docs/rebuild-architecture.md](./docs/rebuild-architecture.md) for:

- what is being kept from the old repo
- what is being refactored or rebuilt
- page map
- data model map
- dashboard information architecture
- admin information architecture
- roadmap model
- payment approval flow

