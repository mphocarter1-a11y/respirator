import { Preferences } from "@capacitor/preferences";

export async function loadKey(key, fallback) {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    console.error("storage load failed", key, e);
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}

export async function deleteKey(key) {
  try {
    await Preferences.remove({ key });
  } catch (e) {
    console.error("storage delete failed", key, e);
  }
}
