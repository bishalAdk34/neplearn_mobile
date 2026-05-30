// Google OAuth client IDs
// Get these from https://console.cloud.google.com/apis/credentials

// Web client — used when running on web (npx expo start --web)
// Authorized redirect URIs to add in Google Cloud Console:
//   - http://localhost:8081
export const GOOGLE_CLIENT_ID = '176881736395-29mk0b06ut3v239i07ijuqghg5mj9998.apps.googleusercontent.com';

// Android client — used on native Android
// 1. Go to Google Cloud Console → APIs & Services → Credentials
// 2. Create OAuth 2.0 Client ID → Android
// 3. Package name: com.neplearn.app (update if different)
// 4. SHA-1: get from https://console.cloud.google.com/apis/credentials → For Android
//    Or from: cd android && ./gradlew signingReport
// 5. Paste the full client ID below (e.g., "123456789-abc123.apps.googleusercontent.com")
export const GOOGLE_ANDROID_CLIENT_ID = '176881736395-v2dv6718r1sedu5pgifkvid70vn07jrt.apps.googleusercontent.com';

// iOS client — used on native iOS (optional for now)
// Same process as Android but with iOS bundle ID
export const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
