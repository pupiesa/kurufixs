"use client";

import { Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";
import { updateAssetAction } from "@/app/actions/actions";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditDialog(props: { data: any }) {
  const data = props.data;

  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadMeta() {
      try {
        const res = await fetch("/api/assets/meta");
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setTypes(json.types ?? []);
        setStatuses(json.statuses ?? []);
      } catch (e) {
        // ignore for now
        // eslint-disable-next-line no-console
        console.error("failed to load asset meta", e);
      }
    }
    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Update the asset details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form action={updateAssetAction}>
          <input type="hidden" name="assetId" value={(data && data.id) || ""} />

          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="assetName">Asset Name</Label>
              <Input
                id="assetName"
                name="assetName"
                defaultValue={data?.assetName ?? ""}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="assetCode">Asset Code</Label>
              <Input
                id="assetCode"
                name="assetCode"
                defaultValue={data?.assetCode ?? ""}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="typeName">Type</Label>
                <select
                  id="typeName"
                  name="typeName"
                  defaultValue={data?.type?.name ?? data?.type ?? ""}
                  className="input"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  name="brand"
                  defaultValue={data?.brand ?? ""}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="statusName">Status</Label>
              <select
                id="statusName"
                name="statusName"
                defaultValue={data?.status?.name ?? data?.status ?? ""}
                className="input"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="building">Building</Label>
                <Input
                  id="building"
                  name="building"
                  defaultValue={
                    data?.location?.building ??
                    (typeof data?.location === "string"
                      ? (data.location.split(" ")[0] ?? "")
                      : "")
                  }
                />
              </div>
              <div>
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  name="room"
                  defaultValue={
                    data?.location?.room ??
                    (typeof data?.location === "string"
                      ? (data.location.split(" ")[1] ?? "")
                      : "")
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-5">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
