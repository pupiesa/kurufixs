"use client";
import Image from "next/image";
import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DialogEdit from "./dialogEdit";

interface SimpleUser {
  id: string;
  name?: string | null;
  role?: { name?: string | null } | null;
  image?: string | null;
  email?: string | null;
}

const UserCard = (props: { user: SimpleUser[] }) => {
  const { user } = props;
  const [users, setUsers] = useState<SimpleUser[]>(user);
  return (
    <div className="w-full px-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {users?.map((usr: SimpleUser) => (
        <Card key={usr.id} className="w-full m-2">
          <CardHeader>
            <CardTitle>{usr.name ? usr.name : "Unknow User"}</CardTitle>
            <CardDescription>
              Role :{usr.role?.name ? usr.role?.name : "No role"}
            </CardDescription>
            <CardAction>
              <Image
                src={usr.image ? usr.image : "/defaultAvatar.webp"}
                alt={"user avatar"}
                width={60}
                height={60}
                className="rounded-full"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex items-center px-6 [.border-t]:pt-6">
            <p>Email : {usr.email ? usr.email : "No email found"}</p>
          </CardContent>
          <CardFooter className="flex gap-3 px-6">
            <DialogEdit
              type="edit"
              role={usr.role?.name ?? undefined}
              id={usr.id}
              onUpdated={(newRole?: string, id?: string) =>
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === (id ?? usr.id)
                      ? {
                          ...u,
                          role: {
                            ...(u.role ?? {}),
                            name: newRole ?? undefined,
                          },
                        }
                      : u
                  )
                )
              }
            />
            <DialogEdit
              type="delete"
              onUpdated={(_newRole?: string, deletedId?: string) =>
                setUsers((prev) =>
                  prev.filter((u) => u.id !== (deletedId ?? usr.id))
                )
              }
              id={usr.id}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default UserCard;
