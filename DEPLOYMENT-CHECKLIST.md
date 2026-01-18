# Render Deployment Checklist

## Pre-Deployment

- [x] Health check at `/health`
- [x] `postinstall` script in package.json
- [x] CORS configured
- [x] WebSocket integrated
- [x] BigInt serialization fixed
- [x] Uses `process.env.PORT`

## Files

- [x] `render.yaml` - config file
- [x] `package.json` - scripts ready
- [x] `.gitignore` - excludes node_modules, dist, .env

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=generate-random-64-byte-hex
NODE_ENV=production

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bdsthat.com

# CORS (optional)
CORS_ORIGIN=https://your-frontend.vercel.app
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deploy

1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

2. Create service on Render
   - https://dashboard.render.com
   - New + → Web Service
   - Connect your GitHub repo
   - Auto-detects `render.yaml`

3. Add environment variables
   - Go to Environment tab
   - Add DATABASE_URL, JWT_SECRET, NODE_ENV

4. Deploy and wait

5. Test
```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/api/v1/fe/auth/login
npx wscat -c wss://your-app.onrender.com/ws
```

## Build Process

```bash
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

Start command: `npm start` (runs `node dist/server.js`)

Deploy time: ~5-10 min first time, ~2-5 min after

## Verify

- [ ] Status shows "Live"
- [ ] `/health` returns ok
- [ ] API endpoints work
- [ ] WebSocket connects
- [ ] Database works
- [ ] No errors in logs

## Troubleshooting

**Build fails:** Run `npm run build` locally, check TypeScript errors

**Database error:** Check DATABASE_URL format, needs `?sslmode=require` at end

**Won't start:** Check logs, verify PORT env var, confirm `dist/server.js` exists

**WebSocket fails:** Use `wss://` in prod, check CORS, path must be `/ws`

## Free Tier Notes

Spins down after 15 min idle. First request after sleep takes ~30-60 sec. Upgrade to Starter ($7/mo) for always-on.

## URLs

- REST: `https://your-app.onrender.com/api/v1/fe/*`
- WebSocket: `wss://your-app.onrender.com/ws`
- Health: `https://your-app.onrender.com/health`

## Custom Domain

Settings → Custom Domain → Add CNAME record pointing to your-app.onrender.com

## Links

- https://render.com/docs
- https://render.com/docs/web-services#websocket-support
