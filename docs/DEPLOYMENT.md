# Deployment Guide - AI Bradaa

## Prerequisites

- Node.js 18+
- npm or yarn
- Netlify account (for frontend)
- Gemini API key
- SMTP credentials (for email)

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Server
NODE_ENV=production
PORT=3000

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Authentication
JWT_SECRET=your-random-jwt-secret-32-chars-minimum
SESSION_SECRET=your-random-session-secret-32-chars
ENABLE_OAUTH=false

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@aibradaa.com

# Frontend
APP_URL=https://aibradaa.com
ALLOWED_ORIGINS=https://aibradaa.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Token Management
GEMINI_MONTHLY_QUOTA=1000000
GEMINI_DAILY_QUOTA=50000
```

## Deployment Steps

### 1. Build Frontend

```bash
npm run build
```

This will:
- Compile Tailwind CSS
- Minify JavaScript
- Optimize assets
- Generate production-ready files in `dist/`

### 2. Deploy to Netlify

#### Option A: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Option B: Git Integration

1. Push code to GitHub
2. Connect repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

### 3. Deploy Backend API

#### Option A: Same Netlify Instance (Serverless Functions)

```bash
# API routes automatically become serverless functions
netlify deploy --prod
```

#### Option B: Separate Server (Recommended for scale)

Deploy to:
- Railway
- Render
- DigitalOcean App Platform
- AWS ECS/Lambda

Example for Railway:

```bash
railway login
railway init
railway up
```

### 4. Configure DNS

Point your domain to Netlify:

```
A record: @ -> Netlify IP
CNAME: www -> your-site.netlify.app
```

### 5. Enable HTTPS

Netlify automatically provisions SSL certificates via Let's Encrypt.

### 6. Post-Deployment Checks

- [ ] Test all routes
- [ ] Verify API endpoints
- [ ] Check authentication flow
- [ ] Test PWA installation
- [ ] Verify service worker caching
- [ ] Test offline functionality
- [ ] Check Gemini API integration
- [ ] Verify email sending
- [ ] Test rate limiting
- [ ] Check error logging

## Performance Optimization

### 1. Enable CDN

Netlify CDN is automatic, but verify:
- Static assets cached properly
- Cache headers configured
- Gzip/Brotli compression enabled

### 2. Monitor Performance

- Set up analytics (Netlify Analytics or Google Analytics)
- Monitor Core Web Vitals
- Track API response times
- Monitor Gemini API usage

### 3. Database (Future)

When ready to add database:
- Supabase (PostgreSQL)
- MongoDB Atlas
- PlanetScale (MySQL)

## Monitoring & Logging

### Error Tracking

Integrate Sentry:

```bash
npm install @sentry/node
```

### Analytics

```bash
npm install @vercel/analytics
```

### Uptime Monitoring

- UptimeRobot
- Pingdom
- Better Uptime

## Backup & Recovery

1. **Code**: Git repository (GitHub/GitLab)
2. **Environment**: Backup `.env` securely
3. **User Data**: When database added, schedule backups
4. **Deployment History**: Netlify keeps deployment history

## Scaling Considerations

### Frontend
- Netlify handles auto-scaling
- CDN distributes load globally

### Backend API
- Consider serverless (auto-scales)
- Or containerized deployment with auto-scaling
- Monitor token usage for Gemini API

### Database (Future)
- Connection pooling
- Read replicas
- Caching layer (Redis)

## Security Checklist

- [ ] Environment variables not committed
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] API authentication working
- [ ] CORS configured properly
- [ ] Dependencies updated
- [ ] Security headers via `netlify.toml`

## Rollback Procedure

If deployment fails:

1. Netlify: Use dashboard to revert to previous deployment
2. API Server: Redeploy previous Docker image/commit
3. Database: Restore from backup (if applicable)

## Support

For issues:
1. Check logs in Netlify dashboard
2. Review server logs
3. Check Gemini API status
4. Contact support channels

---

**Last Updated**: 2025-11-06
**Deployment Version**: 1.0.0
