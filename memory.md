# NepLearn Memory

## Build Profiles Setup
- `dev-apk` profile in eas.json — standalone APK with package `com.neplearn.app.dev`, name "NepLearn (Dev)"
- `production` profile — package `com.neplearn.app`, name "NepLearn"
- Both install side by side on the same device
- Local dev: `APP_ENV=development npx expo run:android`

## Google Sign-In (Android)
- `google-services.json` has dummy values — Google Sign-In won't work on either build until real OAuth client IDs are set up
- Steps:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  2. Create OAuth 2.0 Client IDs for Android:
     - One for `com.neplearn.app` (prod)
     - One for `com.neplearn.app.dev` (dev) with debug SHA1
  3. Add them to `.env` as `GOOGLE_ANDROID_CLIENT_ID`
  4. Go to Firebase Console → add Android apps with those package names → download `google-services.json` (replaces current dummy one)

## Stubs / Broken
- `identifyObjects()` in `src/services/ai.ts` returns `null` — camera → vocab feature doesn't work. Needs a vision API provider (Groq doesn't have one)
- `google-services.json` api_key is `dummy_api_key_for_build` — Google Sign-In crashes on Android

## Quality Debt
- Multiple `any` types (e.g., quiz `useState<any[]>([])`)
- 327 words only — needs thousands more

## Missing Features
- Heatmap visualization — `react-native-svg` installed, chart not implemented
- Camera object identification — stubbed out
- More vocabulary words — current data is a seed

## Ship Checklist
- [ ] Real Google OAuth client IDs in Google Cloud Console (prod + dev)
- [ ] Real `google-services.json` from Firebase Console
- [ ] Fix `any` types
- [ ] Add more words
- [ ] `eas build -p android --profile dev-apk` → test on device
- [ ] `eas build -p android --profile production` → Play Store release
