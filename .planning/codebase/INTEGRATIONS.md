# Integrations
The application relies on a mix of local infrastructure and external SaaS providers.

## External Services
- **Clerk Authentication:** Handles the entire user authentication lifecycle. The frontend uses Clerk components (`<SignedIn>`, `<SignedOut>`) and hooks. The backend uses the Clerk SDK middleware to authenticate API requests.
- **MongoDB Atlas:** Hosted NoSQL database for storing user profiles, project metadata, and possibly saved code snippets over time.

## Webhooks
- **Clerk Webhook:** Located at `/api/auth/sync`. Standard implementation verifying SVIX signatures to track `user.created`, `user.updated`, and `user.deleted` events locally in the MongoDB `users` collection.

## Local Services
- **Redis:** Required locally to back the `BullMQ` asynchronous job queues handling the AI generation requests.
- **Local AI Endpoint:** The backend is currently configured to ping a local LLM or API endpoint (mocked as Qwen2.5 HTTP integration) for executing actual code generation.

## Internal APIs
- `/api/auth/*` - User synchronization and data fetching.
- `/api/projects/*` - CRUD operations for storing the builder state.
- `/api/generate/*` - Endpoints to queue generation prompts and poll for completion status.
