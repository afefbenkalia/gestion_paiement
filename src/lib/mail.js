import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendAccountActivatedEmail(to, name) {
  await transporter.sendMail({
    from: `"Centre de Formation" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Activation de votre compte - Centre de Formation",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activation de compte</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <!-- En-tête -->

              <!-- Contenu principal -->
              <tr>
                  <td bgcolor="#ffffff" style="padding: 30px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
    

                          <!-- Titre -->
                          <tr>
                              <td align="center" style="padding-bottom: 20px;">
                                  <h1 style="color: #2c3e50; font-size: 28px; font-weight: 600; margin: 0;">
                                      Compte Activé avec Succès
                                  </h1>
                              </td>
                          </tr>

                          <!-- Message de bienvenue -->
                          <tr>
                              <td align="center" style="padding-bottom: 25px;">
                                  <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin: 0;">
                                      Bonjour <strong>${name}</strong>,
                                  </p>
                              </td>
                          </tr>

                          <!-- Message principal -->
                          <tr>
                              <td style="padding-bottom: 30px;">
                                  <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                                      Nous avons le plaisir de vous informer que votre compte  a été activé avec succès.
                                  </p>
                                  <p style="color: #5d6d7e; font-size: 16px; line-height: 1.6; margin: 0;">
                                      Vous pouvez désormais accéder à votre espace personnel et commencer à utiliser toutes les fonctionnalités mises à votre disposition.
                                  </p>
                              </td>
                          </tr>

            
                      </table>
                  </td>
              </tr>

            

              <!-- Pied de page -->
              <tr>
                  <td bgcolor="#2c3e50" style="padding: 20px 30px; border-radius: 0 0 8px 8px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                              <td align="center">
                                  <p style="color: #bdc3c7; font-size: 12px; line-height: 1.4; margin: 0;">
                                      © ${new Date().getFullYear()} Centre de Formation. Tous droits réservés.<br>
                                      <span style="color: #95a5a6;">
                                          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                                      </span>
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `,
  });
}