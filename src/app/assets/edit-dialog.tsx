"use client";

import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function EditDialog(props: { data: any }) {
  const data = props.data;

  // fullData will hold the authoritative asset object used to populate the form.
  // props.data may be a partial row; we fetch the full asset by id when available.
  const [fullData, setFullData] = useState<any | null>(data ?? null);
  const [loaded, setLoaded] = useState<boolean>(false);

  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [typeValue, setTypeValue] = useState<string>("");
  const [statusValue, setStatusValue] = useState<string>("");

  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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
        console.error("failed to load asset meta", e);
      }
    }
    loadMeta();
    // If we have an id, fetch the full asset record so the form has all editable fields.
    async function loadFullAsset() {
      if (!data?.id) {
        // No id -> this dialog could be used to "create" a new asset. Mark loaded.
        if (mounted) setLoaded(true);
        return;
      }

      try {
        const res = await fetch(`/api/assets/${data.id}`);
        if (!res.ok) {
          // fallback to whatever partial data we have
          if (mounted) setFullData(data ?? null);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        setFullData(json ?? data ?? null);
      } catch (e) {
        console.error("failed to load asset details", e);
        if (mounted) setFullData(data ?? null);
      } finally {
        if (mounted) setLoaded(true);
      }
    }
    loadFullAsset();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync default select values when asset or meta loads
  useEffect(() => {
    const initialType = fullData?.type?.name ?? fullData?.type ?? "";
    const initialStatus = fullData?.status?.name ?? fullData?.status ?? "";
    if (typeValue === "" && initialType) setTypeValue(initialType);
    if (statusValue === "" && initialStatus) setStatusValue(initialStatus);
  }, [fullData, types, statuses]);

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

        {!loaded ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <form
            action={updateAssetAction}
            onSubmit={() => {
              // mark submitting so UI can disable the button
              setSubmitting(true);
              // schedule a refresh after a short delay so the page shows updated data.
              // The server action also calls revalidatePath and redirects to /assets,
              // but calling router.refresh() helps client components pick up new data
              // without requiring a full navigation in some environments.
              setTimeout(async () => {
                try {
                  router.refresh();
                } finally {
                  setSubmitting(false);
                }
              }, 500);
            }}
          >
            <input type="hidden" name="assetId" value={fullData?.id || ""} />

            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="assetName">Asset Name</Label>
                <Input
                  id="assetName"
                  name="assetName"
                  defaultValue={fullData?.assetName ?? ""}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="assetCode">Asset Code</Label>
                <Input
                  id="assetCode"
                  name="assetCode"
                  defaultValue={fullData?.assetCode ?? ""}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="typeName">Type</Label>
                  <input type="hidden" name="typeName" value={typeValue} />
                  <Select value={typeValue} onValueChange={setTypeValue}>
                    <SelectTrigger id="typeName" className="input">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      {types.map((t) => (
                        <SelectItem key={t.id} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    defaultValue={fullData?.brand ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="statusName">Status</Label>
                <input type="hidden" name="statusName" value={statusValue} />
                <Select value={statusValue} onValueChange={setStatusValue}>
                  <SelectTrigger id="statusName" className="input">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="building">Building</Label>
                  <Input
                    id="building"
                    name="building"
                    defaultValue={
                      fullData?.building ?? fullData?.location?.building ?? ""
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    name="room"
                    defaultValue={fullData?.room ?? fullData?.location?.room ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    defaultValue={fullData?.model ?? ""}
                  />
                </div>
                <div>
                  <Label htmlFor="serialNo">Serial No</Label>
                  <Input
                    id="serialNo"
                    name="serialNo"
                    defaultValue={fullData?.serialNo ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    defaultValue={
                      fullData?.purchaseDate
                        ? new Date(fullData.purchaseDate)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyExp">Warranty Exp</Label>
                  <Input
                    id="warrantyExp"
                    name="warrantyExp"
                    type="date"
                    defaultValue={
                      fullData?.warrantyExp
                        ? new Date(fullData.warrantyExp)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="note">Note</Label>
                <textarea
                  id="note"
                  name="note"
                  className="input h-24 resize-y"
                  defaultValue={fullData?.note ?? ""}
                />
              </div>
            </div>

            <DialogFooter className="mt-5">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
