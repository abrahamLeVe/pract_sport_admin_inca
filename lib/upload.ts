import { uploadFileToS3Action } from "@/app/actions/storage";

interface UploadMediaResult {
  success: boolean;
  message?: string;
  url: string | null;
  key: string | null;
}

// 🔥 Definimos la constante aquí para mantenimiento fácil
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB uniformes

// ... imports
export async function handleMediaUpload(
  formData: FormData,
  fieldName: string,
  folder: string,
  type: "image" | "video" | "merch" | "document", // Asegúrate que este tipo coincida
  isRequired: boolean = false,
): Promise<UploadMediaResult> {
  const file = formData.get(fieldName) as File;

  if (!file || file.size === 0) {
    if (isRequired)
      return {
        success: false,
        message: `El archivo es obligatorio.`,
        url: null,
        key: null,
      };
    return { success: true, url: null, key: null };
  }

  // 10MB Uniforme para todos
  const MAX_SIZE = 10 * 1024 * 1024;

  const rules = {
    image: {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxSize: MAX_SIZE,
    },
    video: {
      types: ["video/mp4", "video/webm", "video/quicktime"],
      maxSize: MAX_SIZE,
    },
    merch: {
      types: ["video/mp4", "video/webm", "video/quicktime"],
      maxSize: MAX_SIZE,
    },
    document: {
      types: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      maxSize: MAX_SIZE,
    },
  };

  const currentRules = rules[type as keyof typeof rules];

  if (!currentRules) {
    return {
      success: false,
      message: `Tipo de medio no configurado: ${type}`,
      url: null,
      key: null,
    };
  }

  // Validación de tipo
  if (!currentRules.types.includes(file.type)) {
    return {
      success: false,
      message: `Formato no permitido. Recibido: ${file.type}`,
      url: null,
      key: null,
    };
  }

  // Validación de tamaño
  if (file.size > currentRules.maxSize) {
    return {
      success: false,
      message: "El archivo supera los 10MB.",
      url: null,
      key: null,
    };
  }

  const s3Result = await uploadFileToS3Action(file, folder);
  return {
    success: s3Result.success,
    url: s3Result.url,
    key: s3Result.key,
    message: s3Result.message,
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
    // 🔥 También actualizado a 10MB aquí
    if (file.size > MAX_SIZE_BYTES) {
      return { success: false, message: "Una imagen supera los 10MB." };
    }
  }

  // Subimos en paralelo
  const imageUploads = await Promise.all(
    validFiles.map((file) => uploadFileToS3Action(file, folder)),
  );

  const imagesJson = imageUploads
    .filter((res) => res && res.success)
    .map((res) => ({ url: res.url, key: res.key }));

  return { success: true, images: imagesJson };
}
