"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Pencil, Trash2 } from "lucide-react";

interface DialogEditProps {
  type: string;
  role?: string;
  id?: string;
  onUpdated?: (newRole: string, id: string) => void;
}

const DialogEdit = (props: DialogEditProps) => {
  const types = props.type;
  const role = props.role;
  const id = props.id;
  const onUpdated = props.onUpdated;
  const [value, setValue] = React.useState(role);
  const [values, setValues] = React.useState(id);
  return (
    <div className="flex-1">
      <Dialog>
        <DialogTrigger asChild>
          {types == "edit" ? (
            <Button type="button" variant="outline" className="w-full">
              <Pencil />
              Edit User role
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={async () => {
                try {
                  const res = await fetch("/api/role/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: id }),
                  });
                  if (res.ok) {
                    onUpdated?.(values as string, id as string);
                  } else {
                    const j = await res.json().catch(() => ({}));
                    console.error("Failed to delete user", j);
                    alert(j?.error || "Failed to delete user");
                  }
                } catch (error) {
                  console.error("Error updating user role:", error);
                  alert("Error deleting user");
                } finally {
                  console.log("Deleted user attemped");
                }
              }}
            >
              <Trash2 />
              Delete
            </Button>
          )}
        </DialogTrigger>
        {types == "edit" ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              Current selected role: <span className="font-bold">{value}</span>
            </p>
            <Select onValueChange={setValue}>
              <SelectTrigger className="w-[90%] mx-auto">
                <SelectValue placeholder={value} defaultValue={value} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>
                    Chooose user role you want to assign
                  </SelectLabel>
                  <SelectItem value="viewer">viewer</SelectItem>
                  <SelectItem value="staff">staff</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <DialogFooter className=" flex gap-y-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant="default"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/role/assign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: id, roleName: value }),
                      });
                      if (res.ok) {
                        // Optimistically update parent UI
                        onUpdated?.(value as string, id as string);
                      } else {
                        const j = await res.json().catch(() => ({}));
                        console.error("Failed to update role", j);
                        alert(j?.error || "Failed to update role");
                      }
                    } catch (error) {
                      console.error("Error updating user role:", error);
                      alert("Error updating user role");
                    } finally {
                      console.log("Role update attempted");
                    }
                  }}
                >
                  Save Changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        ) : (
          ""
        )}
      </Dialog>
    </div>
  );
};

export default DialogEdit;
