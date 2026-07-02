import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

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

    return new Promise((resolve) => {
      sound!.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound?.unloadAsync();
          resolve();
        }
      });
    });
  } catch (error) {
    // Unload sound on failure
    if (sound) {
      await sound.unloadAsync();
    }
    console.warn('TTS playback failed:', error);
  }
}

export async function speak(text: string, lang: string = 'ne-NP'): Promise<void> {
  const voices = await Speech.getAvailableVoicesAsync();
  const hasLang = voices.some(v => v.language === lang);

  if (hasLang) {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) await Speech.stop();
    await Speech.speak(text, { language: lang, rate: 0.8 });
  } else {
    await speakViaUrl(text, lang);
  }
}
