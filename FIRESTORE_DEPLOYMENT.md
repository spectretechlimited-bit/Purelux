# Firebase Firestore Rules Deployment Guide

## Problem
You're seeing this error when trying to add services:
```
Failed to add service FirebaseError: Missing or insufficient permissions.
```

This happens because the **Firestore security rules haven't been deployed to your Firebase project** yet.

## Solution: Deploy Rules to Firebase Console

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your **PureLux** project

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click **Firestore Database**
2. Click the **Rules** tab at the top

### Step 3: Copy & Paste the Rules
1. Open the file `firestore.rules` in your project (at the root level)
2. Copy **ALL** the content (from `rules_version = '2';` to the last closing brace `}`)
3. In Firebase Console, **clear** the existing rules
4. **Paste** the content from `firestore.rules`

### Step 4: Publish
Click the **Publish** button

## What These Rules Do
```
✅ Anyone can CREATE bookings & contact messages
✅ Only admin@purelux.com can CREATE/READ/DELETE services
✅ Only admin@purelux.com can READ/DELETE bookings
✅ Only admin@purelux.com can READ all messages
✅ All fields are validated (required fields, minimum lengths)
```

## After Deployment
- Refresh your browser
- Try adding a service again
- It should now work!

## Important Notes
- The admin email **must be** `admin@purelux.com` in Firebase Auth
- The `firestore.rules` file is **NOT committed to GitHub** (it's in `.gitignore`)
- Never share your Firebase credentials publicly

## Firestore Rules File Location
> `c:\PROJECTS\PureLux\firestore.rules`
