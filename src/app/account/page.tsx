import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { updateProfileAction } from "@/app/actions/actions";

export const runtime = "nodejs";

async function getData(userId: string | undefined) {
  if (!userId) return null;
  const users = await prisma.user.findUnique({
    where: { id: userId },
  });
  return users;
}

const Page = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  const user = await getData(userId);

  console.log(user);
  return (
    <div className="flex justify-center mt-10">
      <Card className="w-100 p-5">
        <CardHeader>
          <p className="font-bold text-2xl">Profile Photo</p>
          <Avatar className="h-30 w-30">
            <AvatarImage
              className="h-full w-full object-cover"
              src={user?.image ?? undefined}
              alt={user?.name ?? "User avatar"}
            />
            <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>

          {/* <CardAction>
            <Button variant="outline">Edit Profile</Button>
          </CardAction> */}
        </CardHeader>
        <p className="font-bold text-2xl">Personal Information</p>
        <CardContent>
          <form action={updateProfileAction} className="space-y-4">
            <div>
              <label className="font-bold">Name</label>
              <input
                name="name"
                className="border-2 border-foreground rounded-md p-2 w-full"
                type="text"
                placeholder="Name"
                defaultValue={user?.name ?? ""}
              />
            </div>
            <div>
              <label className="font-bold">Email</label>
              <input
                name="email"
                className="border-2 border-foreground rounded-md p-2 w-full"
                type="email"
                placeholder="you@example.com"
                defaultValue={user?.email ?? ""}
                readOnly
              />
            </div>
            <div>
              <label className="font-bold">Username</label>
              <input
                name="username"
                className="border-2 border-foreground rounded-md p-2 w-full"
                type="text"
                placeholder="username"
                defaultValue={user?.username ?? ""}
              />
            </div>
            <div>
              <label className="font-bold">New Password</label>
              <input
                name="password"
                className="border-2 border-foreground rounded-md p-2 w-full"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" variant="default">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
