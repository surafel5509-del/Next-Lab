# Next Lab

A premium text-AI model development workspace for creating, fine-tuning, evaluating, and deploying language models.

## Current status

**Foundation / dashboard prototype.** The first committed slice establishes a responsive dark UI and navigation shell inspired by the supplied COMETA training-pipeline reference. Dashboard numbers and pipeline events are illustrative demo content, not live infrastructure telemetry. Backend integrations are not yet connected.

## Stack

- Next.js App Router, React, TypeScript
- Supabase (planned: Auth, PostgreSQL, Storage, RLS)
- FastAPI + Redis/Celery workers (planned)
- PyTorch, Hugging Face Transformers, PEFT/LoRA (planned)

## Run locally

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure credentials as needed.
4. Run `npm run dev` and open http://localhost:3000.

## Product modules

- Workspace dashboard and training pipeline overview
- Model catalog and model creation wizard
- Dataset upload, validation, and versioning
- Asynchronous training jobs and GPU worker orchestration
- AI playground and inference adapters
- Evaluations and model comparisons
- Deployment endpoints and API key management
- Usage metering, billing, marketplace
- Organization roles, audit logs, admin tools

## Security and architecture

Use a modular monolith for the product API and isolated asynchronous workers for GPU workloads. Keep training and inference adapters replaceable. Enforce tenant isolation in database policies and APIs, validate file uploads, and keep service credentials server-side only. Never mark a training job successful without worker-confirmed completion.

See `.env.example` for the environment variable template. Never commit real credentials or service-role keys.

## Next steps

1. Add Supabase SSR authentication and protected routes.
2. Add SQL migrations and RLS policies for profiles, workspaces, models, datasets, jobs, versions, evaluations, deployments, API keys, and audit events.
3. Implement private dataset uploads and signed URLs.
4. Add FastAPI job orchestration and Redis-backed workers.
5. Integrate inference and streaming chat.
6. Add automated tests, CI, deployment, and monitoring.
