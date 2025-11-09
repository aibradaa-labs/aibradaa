# AI Bradaa - Netlify Deployment Fix

## Issue
Getting 404 error on Netlify deployment.

## Root Cause
- Build script was creating nested `dist/public` structure
- Netlify was looking for files in wrong location
- Missing index.html entry point

## Solution

### 1. Updated netlify.toml
```toml
publish = "public"  # Changed from "dist"
command = "echo 'No build needed'"  # Serving static files directly
```

### 2. Added index.html
Created `/public/index.html` that redirects to `/app.html`

### 3. Fixed redirect rule
```toml
from = "/*"
to = "/app.html"  # Changed from "/index.html"
```

## How to Deploy

### Option A: Direct Static Deployment (Recommended)

1. **In Netlify Dashboard:**
   - Build command: `echo 'No build needed'`
   - Publish directory: `public`
   - No need to run npm build

2. **Deploy:**
   ```bash
   git add netlify.toml public/index.html
   git commit -m "fix: Configure Netlify for static deployment"
   git push
   ```

3. **Netlify will auto-deploy from the `public` directory**

### Option B: With Build Step (If you want to use the build script)

1. **Update netlify.toml:**
   ```toml
   publish = "dist"
   command = "npm run build"
   ```

2. **Update tools/build.mjs to flatten output:**
   Change line 39 from:
   ```js
   await copyDir(join(ROOT, 'public'), join(DIST, 'public'));
   ```
   To:
   ```js
   await copyDir(join(ROOT, 'public'), DIST);  // Copy to root of dist
   ```

## Testing Locally

```bash
# Serve the public directory
npx serve public

# Or use the dev server
npm run dev
```

## Verify Deployment

After deploying, check:
- [ ] Homepage loads (redirects to /app.html)
- [ ] /app.html loads correctly
- [ ] /signup.html loads correctly
- [ ] CSS files load
- [ ] JavaScript modules load
- [ ] PWA manifest is accessible

## Common Issues

### Still getting 404?
- Check Netlify build logs for errors
- Verify "Publish directory" is set to `public` in Netlify dashboard
- Clear Netlify cache: Deploy → Trigger deploy → Clear cache and retry

### JavaScript not loading?
- Check browser console for MIME type errors
- Verify files have `.mjs` extension
- Check if modules are using correct paths

### API endpoints not working?
- Netlify Functions need to be in `/netlify/functions` directory
- For now, API will only work when you deploy the backend separately
- Consider using Netlify Functions or deploy API to separate service

## Next Steps

For full functionality with API:
1. Deploy backend API separately (Heroku, Railway, Render)
2. Update API base URL in `app/shared/utils/api.mjs`
3. Set environment variables in Netlify dashboard
4. Or use Netlify Functions for serverless API

---

**Quick Fix Applied:** Static deployment from `public` directory ✅
