import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useSettingsStore, TTS_RATES } from '../stores/settings';

const URL_PLAYBACK_TIMEOUT_MS = 15000;

function langCode(lang: string): string {
  return lang === 'ne-NP' ? 'ne' : 'en';
}

async function speakViaUrl(text: string, lang: string): Promise<void> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode(lang)}&q=${encodeURIComponent(text)}`;
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

  let sound: Audio.Sound | null = null;
  try {
    const result = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );
    sound = result.sound;

    await new Promise<void>((resolve) => {
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        sound?.unloadAsync().catch(() => {});
        resolve();
      };

      const timer = setTimeout(settle, URL_PLAYBACK_TIMEOUT_MS);

      sound!.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          settle();
        } else if (!status.isLoaded && status.error) {
          console.warn('TTS playback error:', status.error);
          settle();
        }
      });
    });
  } catch (error) {
    if (sound) {
      await sound.unloadAsync().catch(() => {});
    }
    console.warn('TTS playback failed:', error);
  }
}

export async function speak(
  text: string,
  lang: string = 'ne-NP',
  opts?: { rate?: number }
): Promise<void> {
  const rate = opts?.rate ?? TTS_RATES[useSettingsStore.getState().ttsSpeed];

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const hasLang = voices.some(v => v.language === lang);

    if (hasLang) {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) await Speech.stop();
      await Speech.speak(text, { language: lang, rate });
    } else {
      await speakViaUrl(text, lang);
    }
  } catch (error) {
    console.warn('TTS failed:', error);
  }
}
