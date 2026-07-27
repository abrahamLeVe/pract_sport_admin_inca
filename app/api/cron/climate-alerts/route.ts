import { NextResponse } from "next/server";
import { sendClimateAlertEmail } from "@/lib/email";
import pool from "@/lib/db";
// import pool from "@/lib/db"; (Tu conexión a PostgreSQL)

export async function GET(request: Request) {
  // Opcional pero recomendado: Proteger la ruta para que solo tu servicio de Cron pueda ejecutarla
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    // 1. Buscar eventos que ocurran exactamente en 2 días
    const targetDateQuery = `
      SELECT id, name 
      FROM events 
      WHERE event_date::date = (CURRENT_DATE + INTERVAL '2 days')::date
        AND status = 'published';
    `;
    const eventsRes = await pool.query(targetDateQuery);
    const upcomingEvents = eventsRes.rows;

    if (upcomingEvents.length === 0) {
      return NextResponse.json({ message: "No hay eventos en 2 días." });
    }

    let emailsSent = 0;

    // 2. Por cada evento, buscar a sus atletas y enviar el correo
    for (const event of upcomingEvents) {
      const athletesQuery = `
        SELECT participant_details 
        FROM event_registrations 
        WHERE event_id = $1 
          AND payment_status = 'paid' 
          AND registration_status = 'approved';
      `;
      const athletesRes = await pool.query(athletesQuery, [event.id]);

      const emailPromises = athletesRes.rows.map((athlete) => {
        const details = athlete.participant_details;
        if (details && details.email) {
          emailsSent++;
          return sendClimateAlertEmail({
            email: details.email,
            firstName: details.firstName || "Corredor",
            eventName: event.name,
          });
        }
      });

      await Promise.all(emailPromises);
    }

    return NextResponse.json({
      success: true,
      message: `Se enviaron ${emailsSent} alertas de clima correctamente.`,
    });
  } catch (error) {
    console.error("Error en el cron de clima:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
