# AnnoTinder

A Next.js application for creating annotation surveys with demographic quotas, designed for research data collection.

## Prerequisites

- **Node.js** 18.x or higher
- **Yarn** (this project uses Yarn 4 - it will install automatically via corepack)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd AnnoTinderNext
```

### 2. Enable Corepack (for Yarn 4)

```bash
corepack enable
```

### 3. Install dependencies

```bash
yarn install
```

### 4. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create it manually with the following content:

```env
DATABASE_URL="file:./dev.db"
```

### 5. Set up the database

Generate the Prisma client and create the SQLite database:

```bash
# Generate Prisma client
yarn prisma generate

# Create the database and apply migrations
yarn prisma db push
```

This creates a `dev.db` SQLite file in the `prisma/` directory.

### 6. Start the development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Run ESLint with auto-fix |
| `yarn test` | Run tests in watch mode |
| `yarn test:run` | Run tests once |
| `yarn prisma studio` | Open Prisma Studio (database GUI) |

## Database Management

### View database contents

```bash
yarn prisma studio
```

This opens a web-based GUI at [http://localhost:5555](http://localhost:5555) to browse and edit data.

### Reset the database

```bash
# Delete the database and recreate it
rm prisma/dev.db
yarn prisma db push
```

### Create a migration (for schema changes)

```bash
yarn prisma migrate dev --name <migration-name>
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── f/[slug]/          # Public form view
│   └── form/[formId]/     # Form editor and dashboard
├── components/
│   └── ui/                # Reusable UI components
├── features/              # Feature modules
│   ├── annotation/        # Text annotation functionality
│   ├── demographics/      # Demographics collection
│   ├── informed-consent/  # Consent flow
│   └── quota/             # Quota management
├── lib/                   # Shared utilities
│   ├── api.ts            # API fetch utilities
│   ├── db.ts             # Prisma client
│   └── utils.ts          # General utilities
└── generated/            # Generated Prisma client
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (via Prisma)
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest

## License

Private - Omroep Zwart
