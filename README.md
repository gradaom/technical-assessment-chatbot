# AI Chat

A streaming chat interface built with **Next.js 15 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS v4**. The browser never sees the API key — prompts are proxied through a Next.js Route Handler that streams the model's response back token by token.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

## Requirements coverage

**Core**

- **User interface** — auto-growing textarea, Send/Stop button, Enter to send and Shift+Enter for a newline, suggested prompts on an empty conversation.
- **API integration** — `POST /api/chat` calls the Anthropic Messages API server-side (`app/api/chat/route.ts`). The key stays in the server environment.
- **Dynamic rendering** — responses stream into the transcript over `fetch`; no page reload, no full re-render of the history.
- **State management** — a skeleton placeholder until the first token, a blinking caret while streaming, empty/over-length prompts blocked before the network call, and typed errors for 401/429/5xx, timeouts and network failures with a Retry action.
- **Best practices** — small single-responsibility components, semantic HTML (`<main>`, `<header>`, `<article>`, `<time>`, `role="log"` with `aria-live`), responsive layout, dark mode, and reduced-motion support.

**Bonus**

- **Persistent chat history** — messages are written to `localStorage` and restored on load (`lib/storage.ts`), tolerating corrupt or unavailable storage.
- **Session management** — a "Clear chat" button with a confirm step that wipes both state and storage.
- **Markdown support** — `react-markdown` + `remark-gfm` for tables, lists and task lists, with fenced code blocks rendered in a copy-to-clipboard panel.
- **Unit testing** — 32 Vitest + Testing Library tests covering validation, storage, the `useChat` streaming/error/persistence paths, and the input and message components.

## Architecture

```
app/
  layout.tsx            Root layout, metadata, global styles
  page.tsx              Server component shell
  api/chat/route.ts     Route Handler: validation + streaming proxy to the AI provider
components/
  Chat.tsx              Container: wires the hook to the UI
  ChatInput.tsx         Textarea, submit/stop, character counter
  MessageBubble.tsx     One turn (user plain text, assistant Markdown)
  Markdown.tsx          Markdown renderer + Tailwind element map
  CodeBlock.tsx         Fenced code block with copy button
  LoadingBubble.tsx     Skeleton shown before the first token
  ErrorBanner.tsx       Error surface with Retry / Dismiss
  EmptyState.tsx        Suggested prompts
lib/
  useChat.ts            All chat state: send, stream, stop, retry, persist
  storage.ts            localStorage read/write/clear
  validation.ts         Shared client/server prompt + payload validation
  types.ts              Shared types
tests/                  Vitest suite
```

### Streaming protocol

The route responds with newline-delimited JSON so a failure that happens *after* headers are flushed can still be reported:

```
{"type":"delta","text":"Hel"}
{"type":"delta","text":"lo"}
{"type":"done"}
```

An upstream failure emits `{"type":"error","error":"…"}`, which the client renders on the assistant bubble and in the error banner.

### Error handling

| Situation | Behaviour |
| --- | --- |
| Empty / whitespace-only prompt | Blocked client-side; Send stays disabled |
| Prompt over 4,000 characters | Counter turns red, Send disabled, rejected server-side too |
| Missing `ANTHROPIC_API_KEY` | 500 with a message naming the missing variable |
| Invalid key / rate limit / provider 5xx | Mapped to a plain-language message; Retry offered |
| No first token within 60s | Request aborted client- and server-side, surfaced as a timeout |
| User presses Stop | Stream aborted, partial response kept, no error shown |
| Browser disconnects | `request.signal` aborts the upstream call |

## Swapping the AI provider

Provider code is confined to `app/api/chat/route.ts`. To use OpenAI instead, replace the `client.messages.stream(...)` call with `openai.chat.completions.create({ stream: true, ... })` and keep emitting the same `delta` / `done` / `error` events — nothing in the UI changes.

Configuration lives at the top of that file: `MODEL` (via `ANTHROPIC_MODEL`, default `claude-sonnet-5`), `MAX_TOKENS`, `UPSTREAM_TIMEOUT_MS`, and `MAX_HISTORY_MESSAGES` (only the last 20 turns are sent upstream to bound token cost).
