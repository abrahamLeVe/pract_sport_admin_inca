import { uploadFileToS3Action } from "@/app/actions/storage";

interface UploadMediaResult {
  success: boolean;
  message?: string;
  url: string | null;
  key: string | null;
}

export async function handleMediaUpload(
  formData: FormData,
  fieldName: string,
  folder: string,
  type: "image" | "video" | "merch", // 🔥 Definimos el tipo aquí
  isRequired: boolean = false,
): Promise<UploadMediaResult> {
  const file = formData.get(fieldName) as File;

  // 1. Validar si existe
  if (!file || file.size === 0) {
    if (isRequired) {
      return {
        success: false,
        message: `El archivo (${type}) es obligatorio.`,
        url: null,
        key: null,
      };
    }
    return { success: true, url: null, key: null };
  }

  // 2. Definir reglas según el tipo
  const rules = {
    image: {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxSize: 5 * 1024 * 1024, // 5MB
      errorSize: "La imagen supera los 5MB.",
    },
    video: {
      types: ["video/mp4", "video/webm", "video/quicktime"], // .mp4, .webm, .mov
      maxSize: 50 * 1024 * 1024, // 50MB (Ajusta según necesites)
      errorSize: "El video supera los 50MB.",
    },
    merch: {
      types: ["video/mp4", "video/webm", "video/quicktime"], // .mp4, .webm, .mov
      maxSize: 50 * 1024 * 1024, // 50MB (Ajusta según necesites)
      errorSize: "El video supera los 50MB.",
    },
  };

  const currentRules = rules[type];

  // 3. Validar tipo
  if (!currentRules.types.includes(file.type)) {
    return {
      success: false,
      message: `Formato no permitido. Tipos válidos: ${currentRules.types.join(", ")}`,
      url: null,
      key: null,
    };
  }

  // 4. Validar tamaño
  if (file.size > currentRules.maxSize) {
    return {
      success: false,
      message: currentRules.errorSize,
      url: null,
      key: null,
    };
  }

  // 5. Subir a S3
  const s3Result = await uploadFileToS3Action(file, folder);
  if (!s3Result.success || !s3Result.key || !s3Result.url) {
    return {
      success: false,
      message: s3Result.message || "Error al subir a S3.",
      url: null,
      key: null,
    };
  }

  return { success: true, url: s3Result.url, key: s3Result.key };
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
