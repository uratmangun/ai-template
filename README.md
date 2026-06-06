# AI IDE Template

A Next.js App Router template with AI SDK streaming chat, shadcn/ui + AI Elements UI, and VPS deployment via Podman + Cloudflare Tunnel.

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Clone this template

```bash
gh repo create my-new-repo --template uratmangun/ai-ide-template --private --clone
```

## Scripts

- `pnpm dev` – Next.js dev server
- `pnpm build` – production build
- `pnpm start` – run production server
- `pnpm lint` – ESLint
- `pnpm typecheck` – TypeScript check

## Docker (standalone)

```bash
podman build -t ai-ide-template:latest .
podman run --rm -p 3000:3000 ai-ide-template:latest
```

## VPS Podman quadlet

Create `/etc/containers/systemd/ai-ide-template.container`:

```ini
[Unit]
Description=AI IDE Template (Next.js)
After=network-online.target
Wants=network-online.target

[Container]
Image=localhost/ai-ide-template:latest
ContainerName=ai-ide-template
PublishPort=3000:3000
Environment=NODE_ENV=production
Restart=always

[Service]
Restart=always
TimeoutStartSec=900

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ai-ide-template.service
curl -I http://127.0.0.1:3000
```

## Cloudflare Tunnel ingress

Add ingress in your `cloudflared` config:

```yaml
ingress:
  - hostname: ai-template.uratmangun.ovh
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Apply DNS route once:

```bash
cloudflared tunnel route dns <TUNNEL_NAME_OR_ID> ai-template.uratmangun.ovh
```

Restart tunnel service/container and verify:

```bash
curl -I https://ai-template.uratmangun.ovh
```
