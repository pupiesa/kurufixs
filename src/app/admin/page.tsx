import prisma from "@/lib/db";
import UserCard from "./usercard";

// Ensure this page runs on the Node.js runtime so Prisma Client can be used
export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const getData = async () => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { name: { not: "admin" } } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: { select: { name: true } },
      },
    });
    return users;
  } catch (err) {
    // Log server-side so Vercel function logs show the error
    console.error("AdminPage.getData error:", err);
    return [];
  }
};

const AdminPage = async () => {
  const users = await getData();
  return (
    <div className="flex">
      <UserCard user={users} />
    </div>
  );
};

export default AdminPage;
