"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";

/* ui */
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

/* icons & toast */
import { ChevronsUpDown, Check } from "lucide-react";
import { Toaster, toast } from "sonner";

/* ---------------- Types ---------------- */
type AssetOption = { id: string; assetCode: string; assetName: string };
type ReportFormProps = { assets?: AssetOption[] };

/* ---------------- Schema ---------------- */
const schema = z
  .object({
    assetId: z.string().optional(),
    assetCodeManual: z.string().optional(),
    assetNameManual: z.string().optional(),
    assetTypeName: z.string().optional(),
    assetStatusName: z.string().optional(),
    issueTitle: z.string().min(2, "กรุณากรอกหัวข้อปัญหา"),
    issueDescription: z.string().min(4, "กรุณาระบุรายละเอียด"),
    issueCategory: z.string().optional(),
    urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    imageUrl: z.string().url().optional().or(z.literal("")),
    reporterId: z.string().optional().nullable(),
    reporterPhone: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const hasSelected = !!val.assetId && val.assetId.length > 0;
    const hasManual = !!val.assetNameManual && val.assetNameManual.length > 0;
    if (!hasSelected && !hasManual) {
      ctx.addIssue({
        code: "custom",
        path: ["assetNameManual"],
        message: "กรุณาเลือกครุภัณฑ์หรือกรอกชื่อครุภัณฑ์",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

/* ---------------- Simple full-screen combobox (Dialog) ---------------- */
type AssetSelectDialogProps = {
  assets: AssetOption[];
  value?: string;
  onChange: (next?: string) => void;
  placeholder?: string;
  labelGetter?: (a: AssetOption) => string;
};

function AssetSelectDialog({
  assets,
  value,
  onChange,
  placeholder = "Select asset...",
  labelGetter = (a) => `${a.assetCode} — ${a.assetName}`,
}: AssetSelectDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => assets.find((a) => a.id === value),
    [assets, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) =>
      `${a.assetCode} ${a.assetName}`.toLowerCase().includes(q)
    );
  }, [assets, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? labelGetter(selected) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 max-w-[100vw] w-[100vw] sm:max-w-lg">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Select Asset</DialogTitle>
          <DialogDescription>Search by asset code or name</DialogDescription>
        </DialogHeader>

        {/* Search box */}
        <div className="px-4 pb-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name..."
            enterKeyHint="search"
          />
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results.
            </div>
          )}

          <ul className="divide-y">
            {filtered.map((a) => {
              const label = labelGetter(a);
              const selected = a.id === value;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(a.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent flex items-center justify-between"
                  >
                    <span className="truncate">{label}</span>
                    {selected && <Check className="h-4 w-4 opacity-80" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Report Form ---------------- */
export default function Reportform({ assets = [] }: ReportFormProps) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [manualAsset, setManualAsset] = useState(false);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!manualAsset) return;
    (async () => {
      setTypesLoading(true);
      try {
        const res = await fetch("/api/assets/meta");
        if (!res.ok) {
          toast.error("โหลดประเภทครุภัณฑ์ไม่สำเร็จ", { description: "ยังสามารถพิมพ์ประเภทเองได้" });
          return;
        }
        const j = await res.json().catch(() => ({} as any));
        if (!mounted) return;
        const names = (j.types ?? []).map((t: any) => String(t.name)).filter(Boolean);
        setAssetTypes(names);
      } catch {
        toast.error("เกิดข้อผิดพลาดในการโหลดประเภท", { description: "กรุณาลองใหม่ภายหลัง หรือพิมพ์เองได้" });
      } finally {
        if (mounted) setTypesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [manualAsset]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      assetId: undefined,
      assetCodeManual: "",
      assetNameManual: "",
      assetTypeName: "",
      issueTitle: "",
      issueDescription: "",
      issueCategory: undefined,
      urgency: "MEDIUM",
      imageUrl: "",
      reporterId: session?.user?.id ?? null,
      reporterPhone: "",
    } as Partial<FormValues>,
    mode: "onChange",
  });

  useEffect(() => {
    if (session?.user?.id) form.setValue("reporterId", session.user.id);
  }, [session?.user?.id, form]);

  const watchedAssetId = form.watch("assetId");
  const selectedAsset = useMemo<AssetOption | undefined>(
    () => assets.find((a) => a.id === watchedAssetId),
    [assets, watchedAssetId]
  );

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await toast.promise(
        (async () => {
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, manualAsset }),
          });
          if (!res.ok) {
            let message = "เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง";
            try {
              const j = await res.json();
              if (j?.message) message = String(j.message);
            } catch {}
            throw new Error(message);
          }
          return await res.json().catch(() => ({}));
        })(),
        {
          loading: "กำลังส่งคำขอ...",
          success: "ส่งฟอร์มแจ้งซ่อมเรียบร้อย",
          error: (err) => (err?.message ? String(err.message) : "บันทึกไม่สำเร็จ"),
        }
      );

      form.reset({
        assetId: undefined,
        assetCodeManual: "",
        assetNameManual: "",
        assetTypeName: "",
        issueTitle: "",
        issueDescription: "",
        issueCategory: undefined,
        urgency: "MEDIUM",
        imageUrl: "",
        reporterId: session?.user?.id ?? null,
        reporterPhone: "",
      } as Partial<FormValues>);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Toaster position="bottom-center" richColors closeButton expand />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
          aria-live="polite"
        >
          {/* ========== ข้อมูลครุภัณฑ์ ========== */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base sm:text-lg">ข้อมูลครุภัณฑ์</h3>

            <Tabs
              value={manualAsset ? "manual" : "select"}
              onValueChange={(v) => {
                const isManual = v === "manual";
                setManualAsset(isManual);
                if (isManual) {
                  form.setValue("assetId", undefined, { shouldValidate: true });
                } else {
                  form.setValue("assetCodeManual", "", { shouldValidate: false });
                  form.setValue("assetNameManual", "", { shouldValidate: true });
                  form.setValue("assetTypeName", "", { shouldValidate: false });
                }
              }}
              className="space-y-3 sm:space-y-4"
            >
              <TabsList className="flex flex-wrap gap-2 justify-start">
                <TabsTrigger className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2" value="select">
                  เลือกจากรายการครุภัณฑ์
                </TabsTrigger>
                <TabsTrigger className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2" value="manual">
                  แจ้งโดยไม่มีรายการครุภัณฑ์
                </TabsTrigger>
              </TabsList>

              <TabsContent value="select" className="space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">ครุภัณฑ์</FormLabel>
                      <FormControl>
                        <AssetSelectDialog
                          assets={assets}
                          value={field.value}
                          onChange={(v) => field.onChange(v)}
                          placeholder="ค้นหา/เลือกครุภัณฑ์ (พิมพ์รหัสหรือชื่อ)"
                          labelGetter={(a) => `${a.assetCode} — ${a.assetName}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <FormLabel className="text-sm sm:text-base">รหัสครุภัณฑ์</FormLabel>
                    <Input value={selectedAsset?.assetCode ?? ""} readOnly />
                  </div>
                  <div>
                    <FormLabel className="text-sm sm:text-base">ชื่อครุภัณฑ์</FormLabel>
                    <Input value={selectedAsset?.assetName ?? ""} readOnly />
                  </div>
                </div>
              </TabsContent>

              {/* Manual mode */}
              <TabsContent value="manual" className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="assetCodeManual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">รหัสครุภัณฑ์ (ถ้ามี)</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น TMP-001" {...field} inputMode="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assetNameManual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">ชื่อครุภัณฑ์</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น คอมพิวเตอร์ Dell" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assetTypeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">ประเภทครุภัณฑ์ (ถ้ามี)</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกประเภท (หรือเว้นว่าง)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[45vh] sm:max-h-80">
                              <SelectItem value="ครุภัณฑ์อื่นๆ">(เว้นว่าง / ครุภัณฑ์อื่นๆ)</SelectItem>
                              {typesLoading && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  กำลังโหลดประเภท...
                                </div>
                              )}
                              {!typesLoading &&
                                assetTypes.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assetStatusName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">สถานะครุภัณฑ์</FormLabel>
                        <Select value={field.value} defaultValue="ชำรุด" onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสถานะ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ชำรุด">ชำรุด</SelectItem>
                            <SelectItem value="สูญหาย">สูญหาย</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ========== รายละเอียดปัญหา ========== */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base sm:text-lg">รายละเอียดปัญหา</h3>

            <FormField
              control={form.control}
              name="issueTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">หัวข้อปัญหา</FormLabel>
                  <FormControl>
                    <Input placeholder="เช่น เครื่องพิมพ์ไม่ทำงาน" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">รายละเอียด</FormLabel>
                  <FormControl>
                    <Textarea placeholder="อธิบายอาการ/สิ่งที่ลองทำแล้ว" className="min-h-28" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="issueCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">ประเภทปัญหา</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="electrical">ไฟฟ้าและระบบจ่ายไฟ (ปลั๊ก/เบรกเกอร์/สายไฟ/UPS)</SelectItem>
                        <SelectItem value="computer_hardware">คอมพิวเตอร์และฮาร์ดแวร์ (PC/โน้ตบุ๊ก/อุปกรณ์ภายใน)</SelectItem>
                        <SelectItem value="software_system">ซอฟต์แวร์และระบบ (OS/โปรแกรม/ลิขสิทธิ์)</SelectItem>
                        <SelectItem value="network_internet">เครือข่ายและอินเทอร์เน็ต (LAN/Wi-Fi)</SelectItem>
                        <SelectItem value="printer_scanner">เครื่องพิมพ์/สแกน/ถ่ายเอกสาร</SelectItem>
                        <SelectItem value="aircon_cooling">เครื่องปรับอากาศ/ระบบทำความเย็น</SelectItem>
                        <SelectItem value="av_equipment">โสตทัศนูปกรณ์ (โปรเจ็กเตอร์/ทีวี/ลำโพง/ไมค์)</SelectItem>
                        <SelectItem value="furniture_office">เฟอร์นิเจอร์/อุปกรณ์สำนักงาน (โต๊ะ/เก้าอี้/ตู้)</SelectItem>
                        <SelectItem value="plumbing_sanitary">ประปา/สุขภัณฑ์ (ก๊อก/ท่อ/ชักโครก)</SelectItem>
                        <SelectItem value="other">อื่น ๆ (ระบุในรายละเอียดให้ชัดเจน)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>เลือกประเภทปัญหา</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">ความเร่งด่วน</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-4 sm:gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="LOW" id="urg-low" />
                          <label htmlFor="urg-low" className="text-sm sm:text-base">LOW</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="MEDIUM" id="urg-med" />
                          <label htmlFor="urg-med" className="text-sm sm:text-base">MEDIUM</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="HIGH" id="urg-high" />
                          <label htmlFor="urg-high" className="text-sm sm:text-base">HIGH</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">ลิงก์รูปหลักฐาน (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>วางลิงก์รูปภาพหลักฐานของปัญหา</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ========== ข้อมูลผู้แจ้ง ========== */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base sm:text-lg">ข้อมูลผู้แจ้ง</h3>
            <input type="hidden" {...form.register("reporterId")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <FormLabel className="text-sm sm:text-base">ชื่อผู้แจ้ง</FormLabel>
                <Input value={session?.user?.name ?? ""} readOnly disabled />
              </div>
              <div>
                <FormLabel className="text-sm sm:text-base">อีเมลผู้แจ้ง</FormLabel>
                <Input value={session?.user?.email ?? ""} readOnly disabled />
              </div>
            </div>
            <FormField
              control={form.control}
              name="reporterPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">เบอร์โทร (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Input placeholder="08x-xxx-xxxx" {...field} inputMode="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <div className="pt-1 sm:pt-2">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "กำลังส่ง..." : "ส่งฟอร์มแจ้งซ่อม"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
