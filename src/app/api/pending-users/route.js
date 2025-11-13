import prisma from "@/lib/prisma"

export async function GET() {
  const pendingUsers = await prisma.user.findMany({
    where: { status: "INACTIVE" },
  })
  return Response.json(pendingUsers)
}
