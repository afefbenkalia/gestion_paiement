import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    // Lire les données envoyées depuis le front
    const { name, email, message } = await req.json();

    // Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Config Email
    await transporter.sendMail({
      from: `"Form Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // email dest
      subject: "Nouveau message depuis le site",
      html: `
        <h2>Nouvelle prise de contact</h2>
        <p><b>Nom :</b> ${name}</p>
        <p><b>Email :</b> ${email}</p>
        <p><b>Message :</b> ${message}</p>
      `,
    });

    return Response.json({ success: true, message: "Email envoyé avec succès" });

  } catch (error) {
    console.error("Erreur email:", error);
    return Response.json({ success: false, error: error.message });
  }
}
