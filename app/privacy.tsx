import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';

const LAST_UPDATED = 'October 6, 2026';

type Section = {
  heading: string;
  body: (string | { bullet: string })[];
};

const SECTIONS: Section[] = [
  {
    heading: '1. Who We Are',
    body: [
      'NepLearn ("the App") is a mobile application that helps you learn Nepali vocabulary, phrases, and grammar. It is built and operated by an independent developer. This Privacy Policy explains what information the App collects, how it is used, and what choices you have.',
      'By using NepLearn, you agree to the practices described in this policy. If you do not agree, please do not use the App.',
    ],
  },
  {
    heading: '2. Information We Collect',
    body: [
      'The App collects only the information needed to provide learning features, sync your progress, and (if you choose) enable AI assistance. The information falls into these categories:',
      { bullet: 'Account information — if you sign in with Google, we receive your Google account name, email address, and profile picture URL from Google. We store these along with a unique user ID in our database.' },
      { bullet: 'Profile preferences — your display name (entered during onboarding), learning goal, skill level, daily XP goal, text-to-speech speed, and learning direction. These are stored on your device and, if signed in, synced to our database.' },
      { bullet: 'Learning progress — words you have marked as learned, XP earned, streak data (current streak, longest streak), completed lessons, and daily activity history. If signed in, this data is synced to our database.' },
      { bullet: 'Quiz and review results — correct and incorrect answers, spaced-repetition review schedules (which words are due for review), and tracked mistakes. If signed in, review schedule data is synced to our database; mistakes are stored only on your device.' },
      { bullet: 'Journal entries — if you write practice journal entries, the prompt text, your written response, and any AI-generated feedback are stored. If signed in, these are saved to our database; if using the App as a guest, they are stored only on your device.' },
      { bullet: 'AI chat messages — if you use the AI Tutor feature, your conversation messages and the AI responses are stored so you can continue conversations. If signed in, these are saved to our database; if a guest, only on your device.' },
      { bullet: 'Notification settings — whether reminders are enabled, chosen reminder times, and word-of-the-day settings. Stored only on your device.' },
      { bullet: 'Your own AI API key (optional) — if you choose to enter your own AI provider API key in Settings, it is stored on your device only. It is never sent to our servers. It is sent directly to the AI provider you selected when you use AI features.' },
      { bullet: 'Offline queue — when you are offline, pending changes (learned words, XP, journal entries, chat messages, profile updates, review data) are queued on your device and sent to our servers when you reconnect.' },
    ],
  },
  {
    heading: '3. Information We Do NOT Collect',
    body: [
      'To be clear, the App does NOT collect the following:',
      { bullet: 'No precise location data.' },
      { bullet: 'No contacts or phone book data.' },
      { bullet: 'No advertising identifiers or device fingerprints for advertising.' },
      { bullet: 'No data sold to third parties.' },
      { bullet: 'No financial or payment information (the App is free).' },
      { bullet: 'No health or biometric data.' },
      { bullet: 'Photos you pick or take with the photo-vocabulary feature are sent to the AI provider at the moment you use the feature to identify objects, and are not stored on our servers.' },
      { bullet: 'Voice input from Echo Practice is handled by your device\'s built-in speech recognition (Apple Speech Recognition on iOS, Google Speech Recognition on Android). Your spoken audio is processed by that platform service to convert speech into text; the recognized text is compared to the expected phrase on your device. We do not receive, store, or have access to your recordings or recognized text.' },
    ],
  },
  {
    heading: '4. How We Collect Information',
    body: [
      'Information is collected in three ways:',
      { bullet: 'Directly from you — when you sign in with Google, enter your name during onboarding, write journal entries, chat with the AI Tutor, or change settings.' },
      { bullet: 'Automatically from your use of the App — your learning activity (words learned, XP, streaks, quiz results, review schedules) is recorded as you use the App.' },
      { bullet: 'From Google Sign-In — when you choose "Sign in with Google," Google shares your name, email, and profile picture with us. This happens only if you actively choose to sign in.' },
    ],
  },
  {
    heading: '5. Why We Collect Information',
    body: [
      'We collect information only for these purposes:',
      { bullet: 'To provide core learning features — tracking which words you have learned, scheduling reviews, recording XP and streaks, and showing your progress.' },
      { bullet: 'To sync your progress across devices — if you sign in, your learning data is stored in the cloud so you do not lose progress when switching devices.' },
      { bullet: 'To provide the AI Tutor, AI journal feedback, and photo-vocabulary features — your messages are sent to an AI service to generate responses.' },
      { bullet: 'To enforce usage limits — a daily limit applies to AI messages so the free service can be sustained. Your usage count is tracked for this purpose.' },
      { bullet: 'To send practice reminders — if you enable notifications, we schedule local reminders on your device. These are sent from your device, not from our servers.' },
      { bullet: 'To operate the weekly leaderboard — if you are signed in, your display name, profile picture URL, and weekly XP appear on the leaderboard visible to other signed-in users.' },
    ],
  },
  {
    heading: '6. How We Store and Protect Your Information',
    body: [
      'Data is stored in two places:',
      { bullet: 'On your device — using encrypted device-local storage (AsyncStorage). This includes your preferences, progress, and (for guests) journal entries and chats.' },
      { bullet: 'In the cloud — if you sign in, your profile, learned words, XP, streaks, review schedules, journal entries, and AI chat history are stored in a Supabase (PostgreSQL) database. Access is restricted by row-level security so each user can only access their own data.' },
      'We use reasonable technical measures to protect your information, including HTTPS for network communication, API keys stored securely, and row-level security policies on the database. However, no method of electronic storage or transmission over the internet is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: '7. Third-Party Services',
    body: [
      'The App relies on the following third-party services. Each processes data according to its own privacy policy:',
      { bullet: 'Google Sign-In (Google LLC) — used for authentication. Google shares your name, email, and profile photo with us when you sign in. See Google\'s Privacy Policy at https://policies.google.com/privacy' },
      { bullet: 'Supabase (Supabase, Inc.) — hosts our authentication system and database where your account and learning progress are stored. See https://supabase.com/privacy' },
      { bullet: 'Groq (Groq, Inc.) — powers the built-in AI Tutor through a server-side proxy. Your chat messages are sent to Groq to generate responses. Groq does not receive your name or email through this integration; only message content is sent. See https://groq.com/privacy-policy' },
      { bullet: 'AI providers you configure yourself (OpenAI, Google AI Studio, OpenRouter, Together AI, or a custom provider) — if you enter your own API key in Settings, your messages are sent directly from your device to that provider using your key. We never see or store your key.' },
      { bullet: 'Wikipedia (Wikimedia Foundation) — the App fetches thumbnail images for vocabulary words from the Wikipedia API. Only the word is sent as a search query; no personal data is shared. See https://foundation.wikimedia.org/wiki/Policy:Privacy_policy' },
      { bullet: 'Google Translate Text-to-Speech — used as a fallback for pronunciation audio when a device voice is unavailable. The word or phrase text is sent to Google to generate audio.' },
      { bullet: 'Google connectivity check (clients3.google.com/generate_204) — used only to verify internet connectivity. No personal data is sent.' },
      { bullet: 'Expo Notifications (Expo, Inc.) — used to schedule local notifications on your device. Notifications are scheduled locally and do not involve our servers sending you push messages.' },
    ],
  },
  {
    heading: '8. Google Sign-In / Google OAuth',
    body: [
      'If you choose to sign in with Google, we request only these OAuth scopes:',
      { bullet: 'openid' },
      { bullet: 'profile (your name and profile picture)' },
      { bullet: 'email (your email address)' },
      'We use this information solely to create and identify your account in the App. We do not access your Google Drive, Gmail, contacts, or any other Google services. You can revoke the App\'s access at any time through your Google Account security settings at https://myaccount.google.com/permissions.',
      'Signing in is entirely optional. You can use all core learning features as a guest without signing in. The only features that require signing in are cloud sync and the built-in AI Tutor (unless you provide your own API key).',
    ],
  },
  {
    heading: '9. Data Sharing',
    body: [
      'We do not sell your personal information. We share data only in these limited circumstances:',
      { bullet: 'With the third-party services listed in Section 7, as needed to provide the App\'s features (for example, chat messages are sent to the AI provider to generate responses).' },
      { bullet: 'With other signed-in users — your display name, profile picture URL, and weekly XP appear on the leaderboard. Your journal entries, chat messages, email, and full profile are never shown to other users.' },
      { bullet: 'If required by law — we may disclose information if required to do so by law or in response to valid legal process.' },
    ],
  },
  {
    heading: '10. Data Retention',
    body: [
      'We keep your data only as long as needed to provide the App\'s features:',
      { bullet: 'Account and learning data — retained until you delete your account or request deletion (see Section 11).' },
      { bullet: 'Journal entries and AI chat history — retained until you delete the relevant conversation or request deletion. You can delete individual AI chat conversations from within the App.' },
      { bullet: 'Offline queue — cleared automatically once operations are successfully synced to the cloud, or when you sign out.' },
      { bullet: 'Local (on-device) data — remains until you clear the App\'s data or uninstall the App.' },
      'If you stop using the App without deleting your account, your data remains in our systems until you request its deletion.',
    ],
  },
  {
    heading: '11. Account and Data Deletion',
    body: [
      'You have the following options to delete your data:',
      { bullet: 'Clear Learned Words — available in Settings. This removes your learned words both locally and in the cloud.' },
      { bullet: 'Delete AI chat conversations — available within the AI Tutor screen. This deletes individual conversations from our database.' },
      { bullet: 'Sign out — available in Settings. This removes your session from your device and clears any pending offline queue entries for your account. Your data remains in our database.' },
      { bullet: 'Full account and data deletion — to delete your account and all associated data (profile, learned words, XP, streaks, journal entries, and chat history), email support@neplearn.com from the email address associated with your account and request deletion. We will process your request within 30 days and confirm when it is complete.' },
      'NOTE: A full in-app "delete account" button is not currently available. Until such a feature is built, email requests are the supported method for full account deletion, as described above.',
    ],
  },
  {
    heading: '12. Your Rights',
    body: [
      'Depending on your location, you may have rights regarding your personal data. These may include:',
      { bullet: 'The right to access the personal data we hold about you.' },
      { bullet: 'The right to correct inaccurate personal data.' },
      { bullet: 'The right to delete your personal data.' },
      { bullet: 'The right to export your data in a portable format.' },
      { bullet: 'The right to object to or restrict certain processing.' },
      { bullet: 'The right to withdraw consent (for example, revoking Google Sign-In access).' },
      'To exercise any of these rights, email support@neplearn.com. We will respond within 30 days.',
      'If you are in the European Economic Area (EEA), United Kingdom, or another region with data protection laws, we process your data on the legal bases of: your consent (when you sign in or provide information), performance of a contract (providing the App\'s features), and our legitimate interests (operating and improving the App).',
    ],
  },
  {
    heading: '13. Children\'s Privacy',
    body: [
      'The App is not directed at children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal information from children under these ages.',
      'If you are a parent or guardian and believe your child has provided personal information to us, please contact support@neplearn.com and we will delete the information promptly.',
      'If we become aware that we have collected personal information from a child without verification of parental consent, we will take steps to remove that information.',
    ],
  },
  {
    heading: '14. Cookies and Tracking',
    body: [
      'The App does not use cookies, tracking pixels, or advertising trackers.',
      'We do not use analytics SDKs, crash-reporting SDKs, or advertising SDKs in the App.',
      'We do not track your activity across other apps or websites.',
    ],
  },
  {
    heading: '15. Analytics and Crash Reporting',
    body: [
      'The App does not currently include any third-party analytics or crash-reporting services. We do not use Google Analytics, Firebase Analytics, Sentry, or similar services.',
      'Diagnostic information is limited to console log messages visible during development and are not transmitted to us from production devices.',
    ],
  },
  {
    heading: '16. Advertising',
    body: [
      'The App does not display advertisements and does not include any advertising SDKs. No advertising identifiers are collected.',
    ],
  },
  {
    heading: '17. Push Notifications',
    body: [
      'The App uses local notifications (scheduled on your device) for practice reminders and word-of-the-day alerts. These are not push notifications sent from a server, and no personal data is transmitted to send them.',
      'You can enable or disable notifications at any time in Settings. Notification preferences are stored only on your device.',
      'On iOS, the App requests microphone and speech-recognition permissions for pronunciation practice, and on Android it requests the RECORD_AUDIO permission for the same purpose.',
    ],
  },
  {
    heading: '18. Changes to This Privacy Policy',
    body: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we do, we will update the "Last Updated" date at the top of this page.',
      'If we make material changes (for example, new types of data collection or new third-party services), we will make reasonable efforts to notify you through the App or by other means before the changes take effect.',
      'We encourage you to review this policy periodically. Continued use of the App after changes take effect constitutes acceptance of the revised policy.',
    ],
  },
  {
    heading: '19. Contact Us',
    body: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:',
      { bullet: 'Email: support@neplearn.com' },
      { bullet: 'Website: https://neplearn.com' },
      'We aim to respond to all privacy-related inquiries within 30 days.',
    ],
  },
];

const Bold = ({ children }: { children: string }) => (
  <Text style={{ fontWeight: '700', color: '#1F2937' }}>{children}</Text>
);

export default function Privacy() {
  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Privacy Policy" backIcon="back" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            fontSize: 26,
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: 4,
          }}
        >
          Privacy Policy
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>
          Last Updated: {LAST_UPDATED}
        </Text>

        <View
          className="bg-white p-5 mb-6"
          style={{ borderRadius: 16, borderColor: '#E5E7EB', borderWidth: 1 }}
        >
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#4A4A4A' }}>
            This policy explains how NepLearn ("the App", "we", "us") handles your
            information when you use the App on iOS, Android, or the web. Please read
            it carefully. It is written in plain language so it is easy to understand.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={{ marginBottom: 28 }}>
            <Text
              style={{
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                fontSize: 18,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 10,
              }}
            >
              {section.heading}
            </Text>
            {section.body.map((item, i) => {
              if (typeof item === 'string') {
                return (
                  <Text
                    key={i}
                    style={{ fontSize: 14, lineHeight: 22, color: '#4A4A4A', marginBottom: 8 }}
                  >
                    {item}
                  </Text>
                );
              }
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    marginBottom: 6,
                    paddingLeft: 4,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.primary, marginRight: 8, lineHeight: 22 }}>
                    •
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      lineHeight: 22,
                      color: '#4A4A4A',
                    }}
                  >
                    {item.bullet}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        <View
          className="p-5 mb-6"
          style={{
            borderRadius: 16,
            backgroundColor: '#EEF2FF',
            borderWidth: 1,
            borderColor: '#C7D2FE',
          }}
        >
          <Bold>Summary of key points</Bold>
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#4A4A4A', marginTop: 8 }}>
            We collect only what is needed to run the App: your Google name/email/photo
            (if you sign in), your learning progress, and content you create (journal
            entries and AI chats). We do not sell data, do not show ads, do not use
            analytics or trackers, and do not collect location. Your data is stored on
            your device and, if signed in, in a secured cloud database. You can request
            full account deletion by emailing support@neplearn.com.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
