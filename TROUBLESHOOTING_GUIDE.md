# Firebase Admin Troubleshooting Guide

This guide covers common issues with Firebase Admin SDK integration, including server-side authentication problems, environment variable configuration, and API route errors.

## Current Issue
You're experiencing server-side errors when trying to perform operations through API routes. Since this project uses Firebase Admin SDK only, all Firebase operations are handled server-side.

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

### Step 3: If Still Not Working - Check Server-Side Authentication

1. Check server logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Ensure Firebase Admin SDK is initializing properly
4. Check API route implementations for proper error handling

### Step 4: If Still Not Working - Server Configuration Issues

The errors might be related to server configuration. Try:

1. Restart the development server: `npm run dev`
2. Verify all environment variables are set correctly
3. Check if the service account has proper permissions
4. Ensure Firebase project is properly configured

### Step 5: Check Firebase Admin SDK Configuration

If the basic setup didn't work, verify your Firebase Admin configuration:

1. Ensure all `FIREBASE_ADMIN_*` environment variables are present
2. Verify the private key format is correct (newlines escaped as `\n`)
3. Check that the project ID matches your Firebase project
4. Confirm the service account email is correct

### Step 6: Verify Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/my-project-1516289182804/settings/general)
2. Verify the project ID matches your `FIREBASE_ADMIN_PROJECT_ID`
3. Check that Firestore is enabled
4. Ensure the service account has proper permissions

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

### Step 8: Check Server Logs and Firebase Console

1. Check your server console for detailed error messages
2. Go to [Firebase Console](https://console.firebase.google.com/project/my-project-1516289182804/firestore)
3. Check the "Usage" tab for any quota issues
4. Look for any error messages or warnings in Firebase Console

### Step 9: Test Firebase Admin Connection

Create a simple test to verify Firebase Admin SDK is working:

```javascript
// test-firebase-admin.js
const { adminDb, adminAuth } = require('./firebase/firebase-admin');

async function testConnection() {
  try {
    // Test Firestore
    const testDoc = await adminDb.collection('test').doc('connection').set({
      timestamp: new Date(),
      status: 'connected'
    });
    console.log('✅ Firestore connection successful');
    
    // Test Auth
    const users = await adminAuth.listUsers(1);
    console.log('✅ Auth connection successful');
    
  } catch (error) {
    console.error('❌ Firebase Admin connection failed:', error);
  }
}

testConnection();
```

## Expected Behavior After Fix

When working correctly, you should see:

1. Server logs showing successful Firebase Admin initialization
2. No server-side errors in API routes
3. Data appears in the Firebase Console > Firestore Database
4. Success responses from API endpoints

## Security Rules (Server-Side Access)

Since this project uses Firebase Admin SDK, security rules are bypassed for server-side operations. However, it's still recommended to have proper rules for any potential client-side access:

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
| `permission-denied` | Security rules blocking access | Not applicable for Admin SDK (bypasses rules) |
| `unauthenticated` | Invalid session/token | Check server-side authentication logic |
| `invalid-argument` | Malformed data in API routes | Check API route data validation |
| `resource-exhausted` | Firebase quotas exceeded | Check Firebase usage |
| **Environment Variable Errors** | Missing/incorrect Firebase Admin config | Check `.env` file, verify private key format |
| **Admin SDK Init Failed** | Service account configuration issues | Verify all `FIREBASE_ADMIN_*` variables |
| **API Route Errors** | Server-side implementation issues | Check API route code and error handling |

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

1. Share the complete server error logs
2. Share your current environment variables (without sensitive data)
3. Confirm you can access Firebase Console
4. Check if the service account has proper permissions in Firebase Console
5. Verify the API route implementations are correct


