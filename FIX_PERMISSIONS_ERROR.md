# ⚠️ CRITICAL: Deploy Firestore Rules NOW

## Problem
You're seeing these errors:
- "Contact message failed FirebaseError: Missing or insufficient permissions."
- "Booking submission failed FirebaseError: Missing or insufficient permissions."

**Reason**: The `firestore.rules` file is **not deployed to Firebase Console** yet.

## Solution: Deploy Rules to Firebase Console (5 minutes)

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com
2. Select **PureLux** project

### Step 2: Navigate to Firestore Rules
1. Left sidebar → **Firestore Database**
2. Click **Rules** tab

### Step 3: Copy Rules
1. Open file: `firestore.rules` (in your project root)
2. Copy **ALL** content

### Step 4: Paste & Publish
1. In Firebase Console, **replace all existing rules**
2. **Paste** the content from `firestore.rules`
3. Click **Publish** button

## Rules Summary
After deployment, these permissions are enabled:

✅ **Anyone** can:
- Create bookings (no auth needed)
- Send contact messages (no auth needed)

✅ **Admin only** (`admin@purelux.com`) can:
- Create/Update/Delete services
- Read all bookings
- Read all messages
- Delete bookings or messages

## Verify It Works
1. Refresh browser
2. Try booking a service → Should work ✅
3. Try sending contact message → Should work ✅
4. If still failing:
   - Check browser console
   - Make sure Firebase rules published (click Publish button)
   - Wait 30 seconds, refresh browser

## Security Note
Rules validate:
- Booking fields (name, phone, date, time, etc.)
- Message fields (name, email, message text)
- Service fields (name, description, price, image)

All data is validated on the database level (not just client-side).

---

**Next**: After you see "✅ Message sent successfully" and bookings work → Everything is connected!
