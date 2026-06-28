import pool from "@/lib/db";
import { UserProfileData } from "@/validations/profile";
// 1. Función para OBTENER los datos actuales del usuario y su perfil
export async function getUserProfileAction(
  userId: number,
): Promise<UserProfileData | null> {
  try {
    // Hacemos un JOIN para traer tanto los datos básicos de acceso (users)
    // como los detalles extendidos (user_profiles)
    const sql = `
      SELECT 
        u.name, u.email, u.image,
        p.document_type, p.document_number, p.phone, p.address, 
        p.city, p.country, p.birth_date, p.gender, p.blood_type, 
        p.tshirt_size, p.emergency_contact, p.emergency_phone
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE u.id = $1;
    `;
    const res = await pool.query(sql, [userId]);
    return res.rows[0] || null;
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
}
