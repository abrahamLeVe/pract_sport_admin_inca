"use server";

import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

export async function uploadFileToS3Action(
  file: File,
  folder: string = "uploads",
) {
  try {
    if (!file || file.size === 0) {
      throw new Error("El archivo está vacío o no es válido.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cleanFileName = file.name.replace(/\s+/g, "-").toLowerCase();
    const uniqueKey = `${folder}/${Date.now()}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueKey,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

    return {
      success: true,
      message: "Archivo subido exitosamente.",
      key: uniqueKey,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error("❌ Error en uploadFileToS3Action:", error.message);
    return {
      success: false,
      message: error.message || "No se pudo subir el archivo a la nube.",
      key: null,
      url: null,
    };
  }
}

export async function getPrivateVideoUrlAction(
  videoKey: string,
  expiresInSeconds: number = 3600,
) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: videoKey, // El key guardado en la BD (ej. "entrenamientos/video.mp4")
    });

    // Generamos el token de acceso seguro que expira (por defecto 1 hora)
    const secureUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      success: true,
      url: secureUrl,
    };
  } catch (error: any) {
    console.error("❌ Error en getPrivateVideoUrlAction:", error.message);
    return {
      success: false,
      message: "No tienes autorización para consumir este recurso multimedia.",
      url: null,
    };
  }
}
