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

## Free CPU training starter

The first CPU-only experiment is available in [`notebooks/Next_Lab_Free_CPU_LoRA_Training.ipynb`](notebooks/Next_Lab_Free_CPU_LoRA_Training.ipynb). It uses `distilbert/distilgpt2` with LoRA, limits the first run to 25 steps and 300 rows, and requires a manual CSV/JSONL upload. Create a model using the exact `distilbert/distilgpt2` base model for this initial workflow. Open `/training` to create a job record, download the dataset, and launch the notebook. The job record remains queued until a verified artifact import workflow exists; creating it does not start training. Free CPU training may be slow or interrupted. No paid compute is activated.

## Security notes

- Tenant isolation is enforced through PostgreSQL row-level security.
- Dataset objects are stored in a private bucket under workspace-scoped paths.
- Only the Supabase publishable key is used in browser code. Never commit service-role keys or other server secrets.
- Do not mark a training job successful without worker-confirmed completion.
- Validate uploaded file size, MIME type, content, and workspace ownership on the server/worker path.

## Environment variables

See `.env.example`.

## Free model-training starter

A Google Colab LoRA fine-tuning notebook is available at [`notebooks/Next_Lab_Free_LoRA_Training.ipynb`](notebooks/Next_Lab_Free_LoRA_Training.ipynb). This is an optional GPU-capable path; for the selected free-only CPU workflow, use the CPU notebook described above.

**Important limits:** Colab's free GPU availability and runtime limits are dynamic and not guaranteed. This notebook performs a user-started training run and exports a LoRA adapter; it does not provide a persistent worker, automatically sync training state back into Next Lab, or deploy an inference endpoint. No paid compute is started. See [Google Colab's official FAQ](https://research.google.com/colaboratory/faq.html) for current restrictions and resource limits.

