# Ouroboros Telegram AI Bot — NestJS

A modular Telegram bot built with NestJS, TypeScript, and Telegraf. It routes conversational text and uploaded documents to Gemini and image prompts to Hugging Face.

## Features

| Input | Behavior |
| --- | --- |
| `/start` | Welcome message |
| Plain text | Gemini response with in-memory conversation context |
| `/reset` | Clear this chat's history |
| `/image <prompt>` | Generate and send an image |
| Uploaded document | Download and analyze the file with Gemini |

The published version does not include a presentation command.

## Setup

Use Node.js 22.12+ and npm:

```sh
npm install
```

Copy `.env.example` to `.env` and provide `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, and `HF_TOKEN`. On PowerShell, use `Copy-Item .env.example .env`.

```sh
npm run start:dev
```

The bot uses Telegram polling. The Nest HTTP server listens on `PORT`, defaulting to 3000. Run one polling process per bot token.

## Structure

- `src/telegram/` — command and message routing.
- `src/chat/` — Gemini chat and in-memory chat history.
- `src/image/` — image generation.
- `src/file/` — document analysis.
- `src/main.ts` — HTTP bootstrap.

## Build and checks

```sh
npm run build
npm run start:prod
```

Available checks are `npm test`, `npm run test:e2e`, and `npm run test:cov`. `npm run lint` runs ESLint with automatic fixes.

## Operational notes

History resets when the process restarts. Text, uploaded file content, and the Telegram user context assembled by the handler are sent to the configured AI providers. Provider availability and account quotas affect responses. Store credentials only in local/server environment configuration.

The repository includes [LICENSE](LICENSE); `package.json` separately declares `UNLICENSED`.
