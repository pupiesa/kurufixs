"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import DialogEdit from "./dialogEdit";

const UserCard = (props: { user: Array<any> }) => {
  const { user } = props;
  const [users, setUsers] = useState<any[]>(user);
  return (
    <div className="w-full px-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {users &&
        users.map((usr: any) => (
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
                role={usr.role?.name}
                id={usr.id}
                onUpdated={(newRole: string) =>
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === usr.id
                        ? { ...u, role: { ...(u.role ?? {}), name: newRole } }
                        : u
                    )
                  )
                }
              />
              <DialogEdit
                type="delete"
                onUpdated={() =>
                  setUsers((prev) => prev.filter((u) => u.id !== usr.id))
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
