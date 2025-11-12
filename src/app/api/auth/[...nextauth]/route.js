import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // 🔹 Vérifie si l'utilisateur existe
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) throw new Error("Utilisateur non trouvé")

        // 🔹 Vérifie le mot de passe
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) throw new Error("Mot de passe incorrect")

        // 🔹 Bloquer uniquement si le compte n’est pas encore approuvé ET ce n’est pas un responsable
        if (user.role !== "RESPONSABLE" && user.status !== "APPROVED") {
          throw new Error("⏳ Compte en attente d'approbation du responsable.")
        }

        // ✅ Connexion autorisée
        return user
      },
    }),
  ],

  // Gestion de la session JWT
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.id = token.id
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
