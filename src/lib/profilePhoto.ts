import { launchCameraAsync, launchImageLibraryAsync } from './imagePicker';

const PHOTO_URI_KEY = 'profile_photo_uri';

export async function loadProfilePhotoUri(): Promise<string | null> {
  try {
    return localStorage.getItem(PHOTO_URI_KEY);
  } catch {
    return null;
  }
}

export async function saveProfilePhotoFromUri(sourceUri: string): Promise<string> {
  localStorage.setItem(PHOTO_URI_KEY, sourceUri);
  return sourceUri;
}

export async function clearProfilePhoto(): Promise<void> {
  localStorage.removeItem(PHOTO_URI_KEY);
}

export async function pickProfilePhoto(): Promise<string | null> {
  const result = await launchImageLibraryAsync();
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return saveProfilePhotoFromUri(result.assets[0].uri);
}

export async function takeProfilePhoto(): Promise<string | null> {
  const result = await launchCameraAsync();
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  return saveProfilePhotoFromUri(result.assets[0].uri);
}

export function promptProfilePhoto(onPicked: (uri: string) => void): void {
  const useCamera = window.confirm('Use camera? Click Cancel for gallery.');
  void (async () => {
    const uri = useCamera ? await takeProfilePhoto() : await pickProfilePhoto();
    if (uri) onPicked(uri);
  })();
}
