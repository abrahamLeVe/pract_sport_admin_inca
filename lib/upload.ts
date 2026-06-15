import { uploadFileToS3Action } from "@/app/actions/storage";

interface UploadImageResult {
  success: boolean;
  message?: string;
  url: string | null;
  key: string | null;
}

export async function handleImageUpload(
  formData: FormData,
  fieldName: string = "image",
  folder: string,
  isRequired: boolean = false,
): Promise<UploadImageResult> {
  const imageFile = formData.get(fieldName) as File;

  if (!imageFile || imageFile.size === 0) {
    if (isRequired) {
      return {
        success: false,
        message: "La imagen es obligatoria. Por favor, sube una.",
        url: null,
        key: null,
      };
    }

    return { success: true, url: null, key: null };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(imageFile.type)) {
    return {
      success: false,
      message: "Formato no permitido. Solo JPG, PNG o WEBP.",
      url: null,
      key: null,
    };
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    return {
      success: false,
      message: "La imagen supera el límite de 5MB.",
      url: null,
      key: null,
    };
  }

  const s3Result = await uploadFileToS3Action(imageFile, folder);
  if (!s3Result.success || !s3Result.key || !s3Result.url) {
    return {
      success: false,
      message: s3Result.message || "Error al subir la imagen a S3.",
      url: null,
      key: null,
    };
  }

  return {
    success: true,
    url: s3Result.url,
    key: s3Result.key,
  };
}

export async function handleMultipleImagesUpload(
  formData: FormData,
  fieldName: string,
  folder: string,
  isRequired: boolean = false,
) {
  const files = formData.getAll(fieldName) as File[];
  const validFiles = files.filter((f) => f.size > 0);

  if (validFiles.length === 0) {
    if (isRequired) {
      return {
        success: false,
        message: "Debes subir al menos una imagen.",
        images: [],
      };
    }
    return { success: true, images: [] };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];

  for (const file of validFiles) {
    if (!validTypes.includes(file.type)) {
      return { success: false, message: "Solo JPG, PNG o WEBP permitidos." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "Una imagen supera los 5MB." };
    }
  }

  // 3. Subimos en paralelo
  const imageUploads = await Promise.all(
    validFiles.map((file) => uploadFileToS3Action(file, folder)),
  );

  const imagesJson = imageUploads
    .filter((res) => res && res.success)
    .map((res) => ({ url: res.url, key: res.key }));

  return { success: true, images: imagesJson };
}
