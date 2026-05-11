import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM ?? "Caiena Beauty Nails <noreply@caienanails.com>";

export async function sendBookingRequestEmail({
  to,
  name,
  styleName,
  desiredDate,
  desiredTime,
}: {
  to: string;
  name: string;
  styleName: string;
  desiredDate: string;   // e.g. "2026-05-30"
  desiredTime: string;   // e.g. "16:00"
}) {
  const firstName = name.split(" ")[0];

  const dateLabel = new Date(desiredDate + "T12:00:00").toLocaleDateString("es-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solicitud recibida — Caiena Beauty Nails</title>
</head>
<body style="margin:0;padding:0;background:#FEF9F7;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF9F7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="width:52px;height:52px;border-radius:12px;background:#C98B8B;display:inline-flex;align-items:center;justify-content:center;font-size:28px;color:#FEF9F7;font-family:Georgia,serif;line-height:1;">
                C
              </div>
              <p style="margin:12px 0 0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#C98B8B;">Caiena Beauty Nails</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:20px;padding:40px 48px;box-shadow:0 4px 32px rgba(58,16,32,0.06);">

              <p style="margin:0 0 8px;font-size:24px;font-style:italic;color:#3A1020;font-weight:400;">
                ¡Hola, ${firstName}!
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#8c6854;line-height:1.6;">
                Recibimos tu solicitud de cita. La confirmaremos a la brevedad por WhatsApp.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:#F7EDE8;margin-bottom:28px;"></div>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C98B8B;">Diseño</span><br/>
                    <span style="font-size:16px;color:#3A1020;">${styleName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C98B8B;">Fecha solicitada</span><br/>
                    <span style="font-size:16px;color:#3A1020;text-transform:capitalize;">${dateLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C98B8B;">Hora</span><br/>
                    <span style="font-size:16px;color:#3A1020;">${desiredTime}</span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background:#F7EDE8;margin:28px 0;"></div>

              <p style="margin:0;font-size:14px;color:#8c6854;line-height:1.7;">
                Te avisaremos por WhatsApp cuando tu cita esté confirmada.<br/>
                Si tienes preguntas, responde este correo o escríbenos directamente.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#DCC8BC;letter-spacing:0.08em;">
                Caiena Beauty Nails · Leander, TX
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Solicitud recibida — ${styleName}`,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send booking request email:", err);
  }
}
