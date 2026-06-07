import pool from "@/lib/db";

export async function getClubSettings() {
  const result = await pool.query("SELECT * FROM club_settings WHERE id = 1");
  return (
    result.rows[0] || {
      name: "Mi Club Deportivo",
      primary_color: "#000000",
      secondary_color: "#FFFFFF",
      logo_url: "",
    }
  );
}
