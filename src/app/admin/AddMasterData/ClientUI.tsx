"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus, Database, MapPin, Shapes, Trash2, Check, Pencil, X,
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type TypeRow = { id: string; name: string; description?: string | null };
type LocationRow = {
  id: string; building: string; room: string; floor?: number | null; description?: string | null;
};

interface Props {
  initialTypes: TypeRow[];
  initialLocs: LocationRow[];
  onAddType: (input: { name: string; description?: string | null }) => Promise<TypeRow>;
  onAddLocation: (input: {
    building: string; room: string; floor?: number | null; description?: string | null;
  }) => Promise<LocationRow>;
  onEditType: (input: { id: string; name: string; description?: string | null }) => Promise<TypeRow>;
  onEditLocation: (input: {
    id: string; building: string; room: string; floor?: number | null; description?: string | null;
  }) => Promise<LocationRow>;
  onDeleteType: (input: { id: string }) => Promise<{ ok: true }>;
  onDeleteLocation: (input: { id: string }) => Promise<{ ok: true }>;
}

export default function ClientUI({
  initialTypes,
  initialLocs,
  onAddType,
  onAddLocation,
  onEditType,
  onEditLocation,
  onDeleteType,
  onDeleteLocation,
}: Props) {
  // lists
  const [types, setTypes] = useState<TypeRow[]>(initialTypes ?? []);
  const [locs,  setLocs]  = useState<LocationRow[]>(initialLocs ?? []);

  // ----- shared forms (Add / Edit on right panel) -----
  // Type
  const [tName, setTName] = useState("");
  const [tDesc, setTDesc] = useState(""); // ✅ แก้บรรทัดนี้ (ลบ the ออก)
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [typeSaveArmed, setTypeSaveArmed] = useState(false);
  const typeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Location
  const [bld, setBld] = useState("");
  const [room, setRoom] = useState("");
  const [floor, setFloor] = useState<string>("");
  const [lDesc, setLDesc] = useState("");
  const [editLocId, setEditLocId] = useState<string | null>(null);
  const [locSaveArmed, setLocSaveArmed] = useState(false);
  const locSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSaveType = useMemo(() => tName.trim().length > 0, [tName]);
  const canSaveLoc  = useMemo(() => bld.trim() && room.trim(), [bld, room]);

  const [pending, startTransition] = useTransition();

  // delete (two-step)
  const [armedId, setArmedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armDeleteOnce = (id: string) => {
    setArmedId(id);
    if (armTimer.current) clearTimeout(armTimer.current);
    armTimer.current = setTimeout(() => setArmedId(null), 3500);
    toast.message("Press again to delete");
  };

  // ====== ADD handlers (newest on top) ======
  const submitTypeAdd = () => {
    if (!canSaveType || pending) return;
    startTransition(async () => {
      try {
        const created = await onAddType({
          name: tName.trim(),
          description: tDesc.trim() || null,
        });
        setTypes((prev) => [created, ...prev]);
        setTName(""); setTDesc("");
        toast.success("เพิ่ม Type สำเร็จ");
      } catch (e: any) {
        toast.error(e?.message || "เพิ่ม Type ไม่สำเร็จ");
      }
    });
  };

  const submitLocationAdd = () => {
    if (!canSaveLoc || pending) return;
    startTransition(async () => {
      try {
        const created = await onAddLocation({
          building: bld.trim(),
          room: room.trim(),
          floor: floor ? Number(floor) : null,
          description: lDesc.trim() || null,
        });
        setLocs((prev) => [created, ...prev]);
        setBld(""); setRoom(""); setFloor(""); setLDesc("");
        toast.success("เพิ่ม Location สำเร็จ");
      } catch (e: any) {
        toast.error(e?.message || "เพิ่ม Location ไม่สำเร็จ");
      }
    });
  };

  // ====== EDIT: open/cancel/toggle ======
  const openTypeEdit = (row: TypeRow) => {
    setEditTypeId(row.id);
    setTName(row.name || "");
    setTDesc(row.description || "");
    setTypeSaveArmed(false);
    if (typeSaveTimer.current) clearTimeout(typeSaveTimer.current);
  };
  const cancelTypeEdit = () => {
    setEditTypeId(null);
    setTName(""); setTDesc("");
    setTypeSaveArmed(false);
    if (typeSaveTimer.current) clearTimeout(typeSaveTimer.current);
  };

  const openLocEdit = (row: LocationRow) => {
    setEditLocId(row.id);
    setBld(row.building || "");
    setRoom(row.room || "");
    setFloor(typeof row.floor === "number" ? String(row.floor) : "");
    setLDesc(row.description || "");
    setLocSaveArmed(false);
    if (locSaveTimer.current) clearTimeout(locSaveTimer.current);
  };
  const cancelLocEdit = () => {
    setEditLocId(null);
    setBld(""); setRoom(""); setFloor(""); setLDesc("");
    setLocSaveArmed(false);
    if (locSaveTimer.current) clearTimeout(locSaveTimer.current);
  };

  // ====== EDIT: two-tap confirm then save ======
  const armTypeSaveOnce = () => {
    setTypeSaveArmed(true);
    if (typeSaveTimer.current) clearTimeout(typeSaveTimer.current);
    typeSaveTimer.current = setTimeout(() => setTypeSaveArmed(false), 3500);
    toast.message("Press again to save changes");
  };

  const armLocSaveOnce = () => {
    setLocSaveArmed(true);
    if (locSaveTimer.current) clearTimeout(locSaveTimer.current);
    locSaveTimer.current = setTimeout(() => setLocSaveArmed(false), 3500);
    toast.message("Press again to save changes");
  };

  const submitTypeEdit = () => {
    if (!editTypeId || !canSaveType || pending) return;
    if (!typeSaveArmed) return armTypeSaveOnce();
    startTransition(async () => {
      try {
        const updated = await onEditType({
          id: editTypeId,
          name: tName.trim(),
          description: tDesc.trim() || null,
        });
        setTypes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        cancelTypeEdit();
        toast.success("บันทึกการแก้ไข Type แล้ว");
      } catch (e: any) {
        toast.error(e?.message || "แก้ไขไม่สำเร็จ");
      }
    });
  };

  const submitLocationEdit = () => {
    if (!editLocId || !canSaveLoc || pending) return;
    if (!locSaveArmed) return armLocSaveOnce();
    startTransition(async () => {
      try {
        const updated = await onEditLocation({
          id: editLocId,
          building: bld.trim(),
          room: room.trim(),
          floor: floor ? Number(floor) : null,
          description: lDesc.trim() || null,
        });
        setLocs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        cancelLocEdit();
        toast.success("บันทึกการแก้ไข Location แล้ว");
      } catch (e: any) {
        toast.error(e?.message || "แก้ไขไม่สำเร็จ");
      }
    });
  };

  // ====== DELETE (two-tap) ======
  const deleteType = (id: string, name: string) => {
    if (busyId || pending) return;
    if (armedId !== id) {
      armDeleteOnce(id);
      return;
    }
    setBusyId(id);
    startTransition(async () => {
      try {
        await onDeleteType({ id });
        setTypes((prev) => prev.filter((x) => x.id !== id));
        toast.success(`ลบ "${name}" แล้ว`);
      } catch (e: any) {
        toast.error(e?.message || "ไม่สามารถลบได้");
      } finally {
        setBusyId(null);
        setArmedId(null);
      }
    });
  };

  const deleteLocation = (id: string, label: string) => {
    if (busyId || pending) return;
    if (armedId !== id) {
      armDeleteOnce(id);
      return;
    }
    setBusyId(id);
    startTransition(async () => {
      try {
        await onDeleteLocation({ id });
        setLocs((prev) => prev.filter((x) => x.id !== id));
        toast.success(`ลบ "${label}" แล้ว`);
      } catch (e: any) {
        toast.error(e?.message || "ไม่สามารถลบได้");
      } finally {
        setBusyId(null);
        setArmedId(null);
      }
    });
  };

  const EmptyHint = ({ text }: { text: string }) => (
    <div className="text-sm text-muted-foreground">{text}</div>
  );

  // ====== Lists (toggle edit with blue highlight) ======
  const TypeList = () => (
    types.length ? (
      <div className="w-full max-h-72 overflow-y-auto rounded-lg border bg-background/40">
        <ul className="w-full divide-y">
          {types.map((t) => {
            const armedDel = armedId === t.id;
            const busy = busyId === t.id;
            const isEditing = editTypeId === t.id;
            return (
              <li
                key={t.id}
                className={`w-full p-3 pl-4 pr-2 rounded-md ${
                  isEditing ? "bg-sky-500/10 ring-1 ring-sky-400" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{t.name}</div>
                    {t.description ? (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {t.description}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    variant={isEditing ? "secondary" : "ghost"}
                    size="icon"
                    className={isEditing ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : ""}
                    onClick={() => {
                      if (isEditing) {
                        // toggle back to Add mode
                        cancelTypeEdit();
                      } else {
                        openTypeEdit(t);
                      }
                    }}
                    aria-label={`Edit ${t.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={armedDel ? "destructive" : "ghost"}
                    size="icon"
                    className={armedDel ? "" : "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"}
                    onClick={() => deleteType(t.id, t.name)}
                    disabled={busy}
                    aria-label={`Delete ${t.name}`}
                  >
                    {armedDel ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    ) : <EmptyHint text="ยังไม่มีข้อมูล" />
  );

  const LocationList = () => (
    locs.length ? (
      <div className="w-full max-h-72 overflow-y-auto rounded-lg border bg-background/40">
        <ul className="w-full divide-y">
          {locs.map((l) => {
            const label = `${l.building}-${l.room}`;
            const armedDel = armedId === l.id;
            const busy = busyId === l.id;
            const isEditing = editLocId === l.id;
            return (
              <li
                key={l.id}
                className={`w-full p-3 pl-4 pr-2 rounded-md ${
                  isEditing ? "bg-sky-500/10 ring-1 ring-sky-400" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{label}</div>
                    <div className="text-sm text-muted-foreground">
                      {typeof l.floor === "number" ? `ชั้น ${l.floor}` : "ไม่ระบุชั้น"}
                      {l.description ? ` • ${l.description}` : ""}
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? "secondary" : "ghost"}
                    size="icon"
                    className={isEditing ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : ""}
                    onClick={() => {
                      if (isEditing) {
                        // toggle back to Add mode
                        cancelLocEdit();
                      } else {
                        openLocEdit(l);
                      }
                    }}
                    aria-label={`Edit ${label}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={armedDel ? "destructive" : "ghost"}
                    size="icon"
                    className={armedDel ? "" : "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"}
                    onClick={() => deleteLocation(l.id, label)}
                    disabled={busy}
                    aria-label={`Delete ${label}`}
                  >
                    {armedDel ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    ) : <EmptyHint text="ยังไม่มีข้อมูล" />
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Selection management</h1>
          <p className="text-muted-foreground">จัดการรายการเลือก (Type / Location) — Admin only</p>
        </div>
      </div>

      <Tabs defaultValue="type" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="type" className="gap-2">
            <Shapes className="h-4 w-4" /> Type
          </TabsTrigger>
          <TabsTrigger value="location" className="gap-2">
            <MapPin className="h-4 w-4" /> Location
          </TabsTrigger>
        </TabsList>

        {/* TYPE */}
        <TabsContent value="type">
          <div className="grid md:grid-cols-2 gap-4">
            {/* list */}
            <Card>
              <CardHeader>
                <CardTitle>รายการที่มีอยู่</CardTitle>
                <CardDescription>ดู/แก้ไข/ลบ ประเภททั้งหมด (เลื่อนรายการได้)</CardDescription>
              </CardHeader>
              <CardContent className="p-4 w-full">
                <TypeList />
              </CardContent>
            </Card>

            {/* right panel: Add or Edit */}
            <Card>
              <CardHeader>
                <CardTitle>{editTypeId ? "Edit Type" : "Add Type"}</CardTitle>
                <CardDescription>
                  {editTypeId ? "แก้ไขรายละเอียดประเภทคุรุภัณฑ์" : "ตั้งชื่อประเภทคุรุภัณฑ์"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="tname">Name *</Label>
                  <Input
                    id="tname"
                    className="h-12 text-base"
                    autoComplete="off"
                    placeholder="เช่น คอมพิวเตอร์, เฟอร์นิเจอร์"
                    value={tName}
                    onChange={(e) => { setTName(e.target.value); setTypeSaveArmed(false); }}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tdesc">Description</Label>
                  <Textarea
                    id="tdesc"
                    className="min-h-[112px] text-base"
                    placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                    value={tDesc}
                    onChange={(e) => { setTDesc(e.target.value); setTypeSaveArmed(false); }}
                    disabled={pending}
                  />
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {editTypeId ? (
                    <>
                      <Button
                        className={`gap-2 ${!typeSaveArmed ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                        variant={typeSaveArmed ? "destructive" : "default"}
                        onClick={submitTypeEdit}
                        disabled={!canSaveType || pending}
                      >
                        <Check className="h-4 w-4" />
                        {typeSaveArmed ? "Confirm save" : "Save changes"}
                      </Button>
                      <Button variant="ghost" onClick={cancelTypeEdit} className="gap-2">
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button className="gap-2" onClick={submitTypeAdd} disabled={!canSaveType || pending}>
                      <Plus className="h-4 w-4" /> Add record
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOCATION */}
        <TabsContent value="location">
          <div className="grid md:grid-cols-2 gap-4">
            {/* list */}
            <Card>
              <CardHeader>
                <CardTitle>รายการที่มีอยู่</CardTitle>
                <CardDescription>ดู/แก้ไข/ลบ สถานที่ทั้งหมด (เลื่อนรายการได้)</CardDescription>
              </CardHeader>
              <CardContent className="p-4 w-full">
                <LocationList />
              </CardContent>
            </Card>

            {/* right panel: Add or Edit */}
            <Card>
              <CardHeader>
                <CardTitle>{editLocId ? "Edit Location" : "Add Location"}</CardTitle>
                <CardDescription>
                  {editLocId ? "แก้ไขรายละเอียดสถานที่" : "ระบุอาคาร/ห้อง/ชั้น"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="bld">Building *</Label>
                    <Input
                      id="bld"
                      className="h-12 text-base"
                      placeholder="เช่น E, M"
                      value={bld}
                      onChange={(e) => { setBld(e.target.value); setLocSaveArmed(false); }}
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room *</Label>
                    <Input
                      id="room"
                      className="h-12 text-base"
                      placeholder="เช่น 107, 109"
                      value={room}
                      onChange={(e) => { setRoom(e.target.value); setLocSaveArmed(false); }}
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      type="number"
                      className="h-12 text-base"
                      placeholder="ชั้น"
                      value={floor}
                      onChange={(e) => { setFloor(e.target.value); setLocSaveArmed(false); }}
                      disabled={pending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ldesc">Description</Label>
                  <Textarea
                    id="ldesc"
                    className="min-h-[112px] text-base"
                    placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                    value={lDesc}
                    onChange={(e) => { setLDesc(e.target.value); setLocSaveArmed(false); }}
                    disabled={pending}
                  />
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {editLocId ? (
                    <>
                      <Button
                        className={`gap-2 ${!locSaveArmed ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                        variant={locSaveArmed ? "destructive" : "default"}
                        onClick={submitLocationEdit}
                        disabled={!canSaveLoc || pending}
                      >
                        <Check className="h-4 w-4" />
                        {locSaveArmed ? "Confirm save" : "Save changes"}
                      </Button>
                      <Button variant="ghost" onClick={cancelLocEdit} className="gap-2">
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button className="gap-2" onClick={submitLocationAdd} disabled={!canSaveLoc || pending}>
                      <Plus className="h-4 w-4" /> Add record
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
