# Netlify Environment Setup Guide

## Overview
Your Firebase credentials are **public** (not secrets), but it's best practice to manage them through Netlify's environment system instead of committing them to git.

## Step 1: Add Environment Variables to Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your **PureLux** site
3. Go to **Site Settings** → **Build & Deploy** → **Environment**
4. Click **Edit variables**

Add these 7 variables with your Firebase credentials:

| Variable Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Firebase Measurement ID |

## Step 2: Local Development

For local development on your machine:
1. Copy `assets/js/firebase-env.template.js` → `assets/js/firebase-env.js`
2. Fill in your Firebase credentials
3. Never commit `firebase-env.js` (it's in `.gitignore`)

## Step 3: Deploy to Netlify

When you push to git:
1. Netlify builds your site
2. The build script creates `firebase-env.js` from environment variables
3. Your site is deployed with credentials injected

## Finding Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your **PureLux** project
3. Click **Project Settings** (gear icon)
4. Go to **Your Apps** section
5. Under Web App, click the config icon and copy all values

## File Structure

```
assets/js/
├── firebase-env.js          ← IGNORED (not in git, created at build)
├── firebase-env.template.js ← COMMITTED (shows structure)
└── [other js files]
```

## Why This Approach?

✅ Credentials never hardcoded in repository  
✅ Different credentials per environment (if needed)  
✅ Easy to rotate credentials (just update Netlify dashboard)  
✅ Follows security best practices  

## Testing Locally

1. Make sure `firebase-env.js` exists in `assets/js/`
2. Open your site in browser
3. Booking, services, and contact forms should work
4. Check browser console - no Firebase errors should appear

## Troubleshooting

**Error: "Firebase environment variables are missing"**
- Make sure `firebase-env.js` is in `assets/js/` folder
- Make sure it has all 7 variables defined

**Credentials not loading on Netlify**
- Check that environment variables are set in Netlify dashboard
- Trigger a rebuild (go to Deploys → Trigger deploy)
- Check browser console for errors
