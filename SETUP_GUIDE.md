# PureLux Firebase + Netlify Setup

## Quick Start

### Local Development (Your Machine)

1. **Firebase config exists locally** (not in git):
   ```bash
   # This file is in .gitignore, so it's not committed
   assets/js/firebase-env.js
   ```

2. **Make sure you have this file** with your Firebase credentials:
   - Copy `assets/js/firebase-env.template.js`
   - Save as `assets/js/firebase-env.js`
   - Add your actual Firebase credentials
   - This file is **ignored by git** ✅

3. **Open the site locally**:
   - Open `index.html` in your browser
   - All features (booking, contact, services, admin) should work

### Production (Netlify)

1. **Set environment variables** in Netlify dashboard:
   - Site Settings → Build & Deploy → Environment
   - Add the 7 Firebase variables (see [NETLIFY_ENV_SETUP.md](NETLIFY_ENV_SETUP.md))

2. **Deploy**:
   - Push to git (credentials never committed)
   - Netlify runs `scripts/build.sh` automatically
   - `firebase-env.js` is generated with production credentials
   - Site deploys with everything working

## File Structure

```
PureLux/
├── netlify.toml                    ← Netlify config + env placeholders
├── scripts/
│   └── build.sh                    ← Auto-generates firebase-env.js
├── assets/js/
│   ├── firebase-env.js             ← IGNORED (local only)
│   ├── firebase-env.template.js    ← TRACKED (template)
│   └── [other files]
├── .gitignore                      ← Includes firebase-env.js
└── NETLIFY_ENV_SETUP.md            ← Netlify instructions
```

## Key Points

✅ **Firebase credentials are public** (not secrets)  
✅ **Still kept out of git** (best practice)  
✅ **Managed via Netlify environment dashboard**  
✅ **Automatically injected at build time**  

## Firestore Rules

Also remember to:
1. Deploy `firestore.rules` to Firebase Console (see [FIRESTORE_DEPLOYMENT.md](FIRESTORE_DEPLOYMENT.md))
2. This enables your database security

## Troubleshooting

**Booking/Contact/Services not working locally?**
- Check that `assets/js/firebase-env.js` exists
- Check browser console for Firebase errors
- Make sure your internet connection is active

**Not working on Netlify after deploy?**
- Verify environment variables are set in Netlify dashboard
- Trigger a manual deploy: Deploy → Trigger deploy
- Check Netlify build logs for errors
