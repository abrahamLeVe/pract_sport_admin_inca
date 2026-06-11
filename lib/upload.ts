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
): Promise<UploadImageResult> {
  const imageFile = formData.get(fieldName) as File;

  // Si no hay archivo o está vacío, se considera un éxito sin subida (campo opcional)
  if (!imageFile || imageFile.size === 0) {
    return { success: true, url: null, key: null };
  }

  // 1. Validar Formato
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(imageFile.type)) {
    return {
      success: false,
      message: "Formato no permitido. Solo JPG, PNG o WEBP.",
      url: null,
      key: null,
    };
  }

  // 2. Validar Peso (5MB)
  if (imageFile.size > 5 * 1024 * 1024) {
    return {
      success: false,
      message: "La imagen supera el límite de 5MB.",
      url: null,
      key: null,
    };
  }

  // 3. Subir a S3
  const s3Result = await uploadFileToS3Action(imageFile, folder);
  if (!s3Result.success || !s3Result.key || !s3Result.url) {
    return {
      success: false,
      message: s3Result.message || "Error al subir la imagen a S3.",
      url: null,
      key: null,
    };
  }

  // Todo salió bien, retornamos las credenciales de la imagen
  return {
    success: true,
    url: s3Result.url,
    key: s3Result.key,
  };
}
