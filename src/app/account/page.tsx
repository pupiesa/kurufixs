import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import React from "react";

async function getData(userId: string | undefined) {
  if (!userId) return null;
  const users = await prisma.user.findUnique({
    where: { id: userId },
  });
  return users;
}

const page = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  const data = await getData(userId);
  console.log(data);
  return (
    <>
      <div>{data?.email}</div>
      <Card className="w-92">
        <CardHeader>{data?.name}</CardHeader>
      </Card>
    </>
  );
};

export default page;
