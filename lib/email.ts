import { Resend } from "resend";

// Inicializamos Resend con la variable de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

interface BibEmailProps {
  email: string;
  firstName: string;
  bibNumber: number;
  athleteId: number; // Para generar el QR único
}

export async function sendBibAssignmentEmail({
  email,
  firstName,
  bibNumber,
  athleteId,
}: BibEmailProps) {
  try {
    // Generamos un código QR al instante usando una API pública gratuita
    // Este QR contendrá el ID del atleta para que tu escáner actual lo lea
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${athleteId}`;

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #16a34a;">¡Tu dorsal ha sido asignado!</h1>
        <p>Hola <strong>${firstName}</strong>,</p>
        <p>Felicidades, tu inscripción está 100% confirmada. Eres el corredor oficial:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h2 style="font-size: 48px; margin: 0; color: #1f2937;">#${bibNumber}</h2>
        </div>

        <p>Presenta este código QR desde tu celular en la zona de Check-in para recoger tu kit el día del evento:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrUrl}" alt="Tu Código QR" style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px;" />
        </div>

        <p>¡Nos vemos en la meta!</p>
        <p style="font-size: 12px; color: #6b7280;">El equipo organizador.</p>
      </div>
    `;

    await resend.emails.send({
      from: "PuntoDepor <inscripciones@puntodepor.com>", // 🔥 TU NUEVO DOMINIO OFICIAL
      to: email,
      subject: "🎟️ ¡Tu número de dorsal oficial y QR de Check-in!",
      html: htmlTemplate,
    });

    return { success: true };
  } catch (error) {
    console.error(`Error enviando correo a ${email}:`, error);
    return { success: false };
  }
}

interface ClimateAlertProps {
  email: string;
  firstName: string;
  eventName: string;
}

export async function sendClimateAlertEmail({
  email,
  firstName,
  eventName,
}: ClimateAlertProps) {
  try {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2563eb;">¡Prepárate para el ${eventName}! 🏃‍♂️</h1>
        <p>Hola <strong>${firstName}</strong>,</p>
        <p>Faltan solo un par de días para vernos en la línea de partida. Queremos asegurarnos de que tengas la mejor experiencia posible, así que aquí tienes algunas recomendaciones clave para el clima y la ruta:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">🏔️ Aclimatación y Clima en Huancayo</h3>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Altitud:</strong> Recuerda que estaremos corriendo a más de 3,200 m.s.n.m. Mantente muy hidratado desde hoy y evita comidas pesadas la noche anterior.</li>
            <li style="margin-bottom: 10px;"><strong>Ropa por capas:</strong> Las mañanas son bastante frías, pero entrarás en calor rápido. Te sugerimos usar un cortavientos ligero que puedas amarrarte a la cintura después de los primeros kilómetros.</li>
            <li><strong>Protección solar:</strong> El sol de altura quema rápido. No olvides aplicarte bloqueador y usar gorra.</li>
          </ul>
        </div>

        <p>¡Descansa bien y nos vemos en la meta!</p>
        <p style="font-size: 12px; color: #6b7280;">El equipo de PuntoDepor.</p>
      </div>
    `;

    await resend.emails.send({
      from: "PuntoDepor <inscripciones@puntodepor.com>",
      to: email,
      subject: "🌤️ Recomendaciones clave de clima y altitud para tu carrera",
      html: htmlTemplate,
    });

    return { success: true };
  } catch (error) {
    console.error(`Error enviando alerta de clima a ${email}:`, error);
    return { success: false };
  }
}
