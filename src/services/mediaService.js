import { isCapacitor } from '../utils/platform';

export const pickImage = async ({ source = 'gallery', quality = 80 } = {}) => {
  if (isCapacitor()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      });

      const photoUrl = photo.webPath || photo.path;
      if (!photoUrl) throw new Error('The camera did not return an image.');
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error('Could not read the captured image.');
      const blob = await response.blob();
      const fileName = `mm-${Date.now()}.${photo.format || 'jpeg'}`;
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

      return {
        file,
        fileName,
        localPreviewUrl: URL.createObjectURL(file),
        source: source === 'camera' ? 'camera' : 'gallery',
        native: true,
      };
    } catch (error) {
      console.warn('Capacitor camera/gallery was unavailable:', error);
      if (source === 'camera') throw error;
    }
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = source === 'camera' ? 'environment' : undefined;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No image was selected.'));
        return;
      }

      resolve({
        file,
        fileName: file.name,
        localPreviewUrl: URL.createObjectURL(file),
        source: source === 'camera' ? 'camera' : 'file-picker',
        native: false,
      });
    };
    input.click();
  });
};
