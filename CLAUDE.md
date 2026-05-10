
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe a component in natural language, and Claude generates React code that renders in real-time inside an isolated iframe — no files are written to disk.

## Commands

```bash
npm run setup        # install deps + prisma generate + migrate
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm test
npx prisma studio    # database GUI
npm run db:reset     # wipe and re-migrate
```

To run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Environment

`ANTHROPIC_API_KEY` in `.env` is optional. When absent or empty, a `MockLanguageModel` kicks in that returns hardcoded example components (Counter, ContactForm, Card). This is the primary way to develop without API credentials.

## Architecture

### Request Flow

1. User types in `ChatInterface` → POST to `/api/chat`
2. Server deserializes the project's `VirtualFileSystem`, prepends the system prompt with prompt caching, then calls Claude via Vercel AI SDK `streamText`
3. Claude responds with tool calls (`str_replace_editor`, `file_manager`) to create/edit/delete files
4. Streamed tool results are forwarded to the client via `onToolCall` callbacks
5. The client updates `FileSystemContext`, which triggers `PreviewFrame` to re-render

### Virtual File System

`src/lib/file-system.ts` — `VirtualFileSystem` holds all component files in memory (a `Map<string, string>`). It is serialized to JSON and stored in the `Project.data` database column. The same class runs on both server (API route) and client (contexts).

### Preview Rendering

`src/lib/transform/jsx-transformer.ts` transforms JSX to runnable browser JS using `@babel/standalone`. It creates an import map pointing React and user-defined files at blob URLs, then generates a complete HTML document injected into the `<iframe>` in `PreviewFrame`. There is no server-side rendering in the preview — everything runs in the browser sandbox.

### AI Tools

Two tools are injected into every Claude call:

| Tool | File | Purpose |
|------|------|---------|
| `str_replace_editor` | `src/lib/tools/str-replace.ts` | create / view / str_replace / insert on virtual files |
| `file_manager` | `src/lib/tools/file-manager.ts` | rename / delete virtual files |

The system prompt lives in `src/lib/prompts/generation.tsx`.

### Auth

Custom JWT auth using `jose` — no NextAuth. Sessions stored in HTTP-only cookies (7-day TTL). Server Actions in `src/actions/` handle sign-up, sign-in, sign-out. Middleware at `src/middleware.ts` protects `/api/` routes only; page-level auth is handled in Server Components.

### Data Persistence

- **Authenticated users:** `Project` rows in SQLite (Prisma). `messages` and `data` columns store JSON strings.
- **Anonymous users:** Work tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts`. A prompt on sign-up offers to save the session work.

### State Management

Two React contexts own all cross-component state:

- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — virtual file system, selected file, file operations
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat`; exposes messages, input, submission

### Path Alias

`@/*` maps to `src/*` throughout the project.

## Database Schema

A estrutura de armazenamento de dados é definida em `prisma/schema.prisma` — consulte esse arquivo como fonte de verdade para modelos, campos e relações.

Após alterar o schema, rode `npx prisma migrate dev --name <description>` para aplicar.

## Code Style

Use comentários com moderação. Só comente código complexo.

## Key Constraints

- The preview iframe has no access to the local file system; all imports resolve through the Babel import map to either ESM.SH CDN URLs or in-memory blob URLs.
- Tailwind CSS in the preview is loaded from CDN at runtime — utility classes work but custom config does not.
- `server-only` is imported in auth and database modules to prevent accidental client-side use.
