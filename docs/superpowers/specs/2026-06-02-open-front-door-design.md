# Open Front Door Feature Design

## Overview

Add a front door control page to the portal app, allowing users with `open-front-door` permission (or `super` role) to open/close the front door via a Tasmota relay switch.

## Architecture

**Page:** `/dashboard/front-door`
- Open/Close buttons (both visible)
- Loading indicator while Tasmota request in flight
- Error message if Tasmota fails

**tRPC Router:** `door.ts`
- `toggle` mutation: `{ action: "open" | "close" }`
- Permission check: `open-front-door` permission OR `super` role

**Tasmota Integration:**
- HTTP request to Tasmota device
- Auth via query params

## Env Vars

| Variable | Description |
|----------|-------------|
| `TASMOTA_IP` | Tasmota device IP |
| `TASMOTA_PORT` | Tasmota port (default 1883) |
| `TASMOTA_USER` | Tasmota username |
| `TASMOTA_PASSWORD` | Tasmota password |

## Tasmota Command

```
http://${TASMOTA_IP}:${TASMOTA_PORT}/cm?user=${TASMOTA_USER}&password=${TASMOTA_PASSWORD}&cmnd=Power${cmd}%20On
```

- `cmd=3` for Open
- `cmd=2` for Close

## Data Flow

1. User clicks Open/Close button
2. UI shows loading state
3. tRPC mutation called with action
4. Server sends HTTP request to Tasmota
5. Tasmota executes relay command
6. UI shows success or error

## Files to Create/Modify

1. `apps/portal/src/server/routers/door.ts` — new router
2. `apps/portal/src/app/dashboard/front-door/page.tsx` — new page
3. `apps/portal/src/server/routers/_app.ts` — register door router
4. `.env.example` — add Tasmota env vars

## Security

- Server-side permission check required
- Tasmota credentials stored server-side only