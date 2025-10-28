"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "../actions/actions";

type AccountUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
};

const Form = (props: { user: AccountUser }) => {
  const { user } = props;
  const User = props.user;
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };
  return (
    <form
      action={updateProfileAction}
      onClick={handleRefresh}
      className="space-y-4"
    >
      <div>
        <label className="font-bold">Name</label>
        <input
          name="name"
          className="border-2 border-foreground rounded-md p-2 w-full"
          type="text"
          placeholder="Name"
          defaultValue={User?.name ?? ""}
        />
      </div>
      <div>
        <label className="font-bold">Email</label>
        <input
          name="email"
          className="border-2 border-foreground rounded-md p-2 w-full"
          type="email"
          placeholder="you@example.com"
          defaultValue={User?.email ?? ""}
          readOnly
          disabled
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
          readOnly={Boolean(user?.username)}
          disabled={Boolean(user?.username)}
        />
        {user?.username && (
          <p className="text-sm text-muted-foreground mt-1">
            Username is set and cannot be changed.
          </p>
        )}
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
      <div>
        <label className="font-bold">Confirm New Password</label>
        <input
          name="confirmPassword"
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
  );
};

export default Form;
