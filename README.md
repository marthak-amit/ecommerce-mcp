# ChatGPT eCommerce MCP Server

## Deploy On Render

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Render, create a new **Web Service** and connect the repository.
3. Use these service settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables in Render:
   - `PORT` (Render usually injects this automatically)
   - `OPENAI_DOMAIN_VERIFICATION_TOKEN=openai-domain-verification=PASTE_TOKEN_HERE`
5. Deploy the service.
6. Verify domain token endpoint:
   - `https://your-render-domain/.well-known/openai-domain-verification`
   - The response must be plain text:
     `openai-domain-verification=PASTE_TOKEN_HERE`

