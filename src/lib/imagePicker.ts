type PickerAsset = { uri: string; width?: number; height?: number; base64?: string | null };
type PickerResult = { canceled: true; assets: null } | { canceled: false; assets: PickerAsset[] };

type PermissionResponse = { granted: boolean; status: string };

let fileInput: HTMLInputElement | null = null;

function getFileInput(): HTMLInputElement {
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }
  return fileInput;
}

export async function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse> {
  return { granted: true, status: 'granted' };
}

export async function requestCameraPermissionsAsync(): Promise<PermissionResponse> {
  return { granted: true, status: 'granted' };
}

function pickFile(capture = false): Promise<PickerResult> {
  return new Promise((resolve) => {
    const input = getFileInput();
    input.value = '';
    input.accept = 'image/*';
    input.capture = capture ? 'environment' : '';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ canceled: true, assets: null });
        return;
      }
      const uri = URL.createObjectURL(file);
      resolve({ canceled: false, assets: [{ uri }] });
    };
    input.click();
  });
}

export async function launchImageLibraryAsync(): Promise<PickerResult> {
  return pickFile(false);
}

export async function launchCameraAsync(): Promise<PickerResult> {
  return pickFile(true);
}
