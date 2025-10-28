import prisma from "@/lib/db";
import UserCard from "./usercard";

const getData = async () => {
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
