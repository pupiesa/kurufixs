import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import Form from "./form";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getData(userId: string | undefined) {
  if (!userId) return null;
  const users = await prisma.user.findUnique({
    where: { id: userId },
  });
  return users;
}

const Page = async () => {
  const session = await auth();
  console.log("Session:", session); // Debugging log for session

  const userId = session?.user?.id;
  console.log("User ID:", userId); // Debugging log for userId

  const user = await getData(userId);
  console.log("User:", user); // Debugging log for user

  return (
    <div className="flex justify-center mt-10 mb-8 px-5">
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
        <CardContent>{user && <Form user={user} />}</CardContent>
      </Card>
    </div>
  );
};

export default Page;
