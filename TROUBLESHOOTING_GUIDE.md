# Firebase Troubleshooting Guide

This guide covers common issues with Firebase integration, including post creation errors, authentication problems, and environment variable configuration.

## Current Issue
You're experiencing `400 (Bad Request)` errors when trying to create posts. The error occurs at the Firestore Write channel level.

## Step-by-Step Solution

### Step 1: Update Firebase Security Rules (TEMPORARY - FOR TESTING)

1. Go to [Firebase Console](https://console.firebase.google.com/project/my-project-1516289182804/firestore/rules)
2. Replace the current rules with these **TEMPORARY TESTING RULES**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all operations for authenticated users - VERY PERMISSIVE
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"** to apply the changes
4. Wait 1-2 minutes for the rules to propagate

### Step 2: Test Post Creation

1. Try creating a post again in your application
2. Check the browser console for the detailed debug information
3. If it works, the issue was with the security rules

### Step 3: If Still Not Working - Check Authentication

1. Open browser Developer Tools (F12)
2. Go to Application tab > Local Storage
3. Look for Firebase auth tokens
4. Try logging out and logging back in
5. Clear browser cache and cookies
6. Try in an incognito/private browser window

### Step 4: If Still Not Working - Network Issues

The 400 errors might be network-related. Try:

1. Check if you're behind a corporate firewall
2. Try using a different network (mobile hotspot)
3. Disable browser extensions temporarily
4. Try a different browser

### Step 5: Alternative Security Rules (If Step 1 Didn't Work)

If the permissive rules didn't work, try even more permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING: These rules allow anyone to read/write your database. Only use for testing!**

### Step 6: Verify Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/my-project-1516289182804/settings/general)
2. Verify the project ID matches: `my-project-1516289182804`
3. Check that Firestore is enabled
4. Verify your app is registered in the project

### Step 7: Check Environment Variable Configuration

Since this project uses environment variables for Firebase Admin SDK, verify:

1. **Environment Variables Exist**: Check your `.env` file contains all required Firebase Admin variables:
   ```env
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. **Private Key Format**: Ensure the private key is properly formatted:
   - Wrapped in quotes
   - Newlines escaped as `\n`
   - No extra spaces or characters

3. **Project ID Consistency**: Verify `FIREBASE_ADMIN_PROJECT_ID` matches your Firebase project

4. **Restart Development Server**: After changing environment variables, restart:
   ```bash
   npm run dev
   ```

### Step 8: Check Firebase Console Logs

1. Go to [Firebase Console](https://console.firebase.google.com/project/my-project-1516289182804/firestore)
2. Check the "Usage" tab for any quota issues
3. Look for any error messages or warnings

### Step 9: Run the Debug Script

Run the debug script to get more detailed information:

```bash
node test-firebase-debug.js
```

Make sure to update the password in the script first.

## Expected Behavior After Fix

When working correctly, you should see:

1. Console logs showing successful post creation
2. No 400 errors in the network tab
3. Post appears in the Firebase Console > Firestore Database
4. Success message in the UI

## Final Security Rules (After Testing)

Once everything works, replace the temporary rules with secure ones:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts collection rules
    match /posts/{postId} {
      // Allow read access to all posts (public)
      allow read: if true;
      
      // Allow write access only to authenticated users
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.authorId;
      
      // Allow update/delete only by the post author
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.authorId;
    }
    
    // Comments collection rules
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth != null 
        && request.auth.uid == resource.data.authorId;
    }
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Common Issues and Solutions

| Error Code | Cause | Solution |
|------------|-------|----------|
| `permission-denied` | Security rules blocking access | Update security rules |
| `unauthenticated` | User not logged in | Re-login user |
| `invalid-argument` | Malformed data | Check data validation |
| `resource-exhausted` | Firebase quotas exceeded | Check Firebase usage |
| `400 Bad Request` | Network/protocol issue | Check network, try different browser |
| **Environment Variable Errors** | Missing/incorrect Firebase Admin config | Check `.env` file, verify private key format |
| **Admin SDK Init Failed** | Service account configuration issues | Verify all `FIREBASE_ADMIN_*` variables |
| **NextAuth Firestore Adapter Error** | Incorrect service account config | Check environment variables in NextAuth route |

## Environment Variable Specific Issues

### Missing Environment Variables
**Symptoms**: Admin SDK fails to initialize, authentication errors
**Solution**: Ensure all `FIREBASE_ADMIN_*` variables are present in `.env`

### Private Key Format Issues
**Symptoms**: Invalid credentials, parsing errors
**Solution**: 
- Wrap private key in quotes
- Replace actual newlines with `\n`
- Ensure no extra spaces or characters

### Project ID Mismatch
**Symptoms**: Cross-project authentication errors
**Solution**: Verify `FIREBASE_ADMIN_PROJECT_ID` matches your Firebase project

### Development Server Not Restarted
**Symptoms**: Changes to environment variables not taking effect
**Solution**: Restart development server with `npm run dev`

## Need More Help?

If none of these steps work:

1. Share the complete console error logs
2. Share your current Firebase Security Rules
3. Confirm you can access Firebase Console
4. Try creating a post directly in Firebase Console (if possible)


