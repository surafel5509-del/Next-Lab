# Next Lab

A text-AI model development platform for creating, fine-tuning, evaluating, and deploying language models.

## Live foundation status

The repository now includes the initial production backend foundation:

- Next.js App Router, React, and TypeScript dashboard shell.
- Supabase project with PostgreSQL schema for profiles, workspaces, members, datasets, models, training jobs, evaluations, deployments, API keys, and usage events.
- Row-level security policies for workspace isolation.
- Private Supabase Storage bucket for dataset uploads with workspace-scoped access policies.
- Supabase SSR browser/server clients, session refresh proxy, email/password signup and sign-in, auth callback, and protected workspace overview.
- Vercel environment variables for the Supabase URL and publishable key.

The overview dashboard still contains illustrative metrics. The live `/workspace` page reads actual authenticated workspace and resource counts. GPU training, inference, evaluation execution, API-key issuance, and model serving are not implemented yet.

## Stack

- Next.js App Router, React, TypeScript
- Supabase Auth, PostgreSQL, Storage, and RLS
- Planned worker layer: Python/FastAPI + Redis queue + isolated GPU workers
- Planned model runtime: PyTorch, Hugging Face Transformers, PEFT/LoRA

## Local setup

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
4. Run `npm run dev` and open http://localhost:3000.
5. Visit `/login` to create an account or sign in. Supabase Auth email confirmation must be enabled/configured for the production domain.

## Product roadmap

1. Complete authentication UX, profile and workspace management.
2. Dataset upload, workspace-scoped private storage, and signed download URLs (dashboard limit: 5 MB).
3. Model registry and persistent model project creation/configuration.
4. Queue-backed training job API and isolated Python/GPU workers.
5. Evaluation runner, benchmark tracking, and model comparison.
6. Inference playground with streaming responses.
7. Deployment endpoints, API key hashing/rotation, usage metering, and quotas.
8. Audit logs, observability, security review, automated tests, and CI.

## Security notes

- Tenant isolation is enforced through PostgreSQL row-level security.
- Dataset objects are stored in a private bucket under workspace-scoped paths.
- Only the Supabase publishable key is used in browser code. Never commit service-role keys or other server secrets.
- Do not mark a training job successful without worker-confirmed completion.
- Validate uploaded file size, MIME type, content, and workspace ownership on the server/worker path.

## Environment variables

See `.env.example`.
