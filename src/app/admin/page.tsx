import { useSession } from "next-auth/react";

const page = () => {
  const { data: session } = useSession();
  const user = session?.user;

  return <div>{user?.role}</div>;
};

export default page;
