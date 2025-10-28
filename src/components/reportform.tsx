"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AssetOption = { id: string; assetCode: string; assetName: string };
type ReportFormProps = { assets?: AssetOption[] };

const schema = z
  .object({
    assetId: z.string().optional(),
    // Manual asset fields when no asset exists in DB
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
    // Require either selecting an existing asset or providing a manual name
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

export default function Reportform({ assets = [] }: ReportFormProps) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [manualAsset, setManualAsset] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      assetId: undefined,
      assetCodeManual: "",
      assetNameManual: "",
      assetTypeName: "",
      assetStatusName: undefined,
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

  // Ensure reporterId updates when session arrives/changes
  useEffect(() => {
    if (session?.user?.id) {
      form.setValue("reporterId", session.user.id);
    }
  }, [session?.user?.id, form]);

  // Watch the selected asset id so selectedAsset updates when the user picks
  // a different item. Use form.watch('assetId') as a dependency for useMemo.
  const watchedAssetId = form.watch("assetId");
  const selectedAsset = useMemo<AssetOption | undefined>(() => {
    return assets.find((a: AssetOption) => a.id === watchedAssetId);
  }, [assets, watchedAssetId]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          manualAsset,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.message || "บันทึกไม่สำเร็จ");
      } else {
        form.reset({
          assetId: undefined,
          assetCodeManual: "",
          assetNameManual: "",
          assetTypeName: "",
          assetStatusName: undefined,
          issueTitle: "",
          issueDescription: "",
          issueCategory: undefined,
          urgency: "MEDIUM",
          imageUrl: "",
          reporterId: session?.user?.id ?? null,
          reporterPhone: "",
        } as Partial<FormValues>);
        alert("ส่งฟอร์มแจ้งซ่อมเรียบร้อย");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 1) ข้อมูลครุภัณฑ์ */}
        <div className="space-y-2">
          <h3 className="font-semibold">ข้อมูลครุภัณฑ์</h3>
          {!manualAsset && (
            <>
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ครุภัณฑ์</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกครุภัณฑ์" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            ไม่มีข้อมูลครุภัณฑ์ในระบบ
                          </div>
                        )}
                        {assets.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.assetCode} — {a.assetName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FormLabel>รหัสครุภัณฑ์</FormLabel>
                  <Input value={selectedAsset?.assetCode ?? ""} readOnly />
                </div>
                <div>
                  <FormLabel>ชื่อครุภัณฑ์</FormLabel>
                  <Input value={selectedAsset?.assetName ?? ""} readOnly />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setManualAsset((v) => !v)}
            >
              {manualAsset ? "เลือกจากรายการครุภัณฑ์" : "แจ้งโดยไม่มีรายการครุภัณฑ์"}
            </Button>
            {!manualAsset && assets.length === 0 && (
              <span className="text-sm text-muted-foreground">
                ไม่มีข้อมูลครุภัณฑ์ ให้กรอกข้อมูลครุภัณฑ์ด้านล่าง
              </span>
            )}
          </div>

          {manualAsset && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetCodeManual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสครุภัณฑ์ (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น TMP-001" {...field} />
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
                    <FormLabel>ชื่อครุภัณฑ์</FormLabel>
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
                    <FormLabel>ประเภทครุภัณฑ์ (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น ครุภัณฑ์อื่นๆ" {...field} />
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
                    <FormLabel>สถานะครุภัณฑ์</FormLabel>
                    <Select
                      value={field.value}
                      defaultValue="ชำรุด"
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* <SelectItem value="ใช้งานอยู่">ใช้งานอยู่</SelectItem> */}
                        {/* <SelectItem value="ซ่อมบำรุง">ซ่อมบำรุง</SelectItem> */}
                        <SelectItem value="ชำรุด">ชำรุด</SelectItem>
                        {/* <SelectItem value="จำหน่าย">จำหน่าย</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* 2) รายละเอียดปัญหา */}
        <div className="space-y-2">
          <h3 className="font-semibold">รายละเอียดปัญหา</h3>
          <FormField
            control={form.control}
            name="issueTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>หัวข้อปัญหา</FormLabel>
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
                <FormLabel>รายละเอียด</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="อธิบายอาการ/สิ่งที่ลองทำแล้ว"
                    className="min-h-28"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issueCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทปัญหา</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
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
                  <FormLabel>ความเร่งด่วน</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="LOW" id="urg-low" />
                        <label htmlFor="urg-low">LOW</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MEDIUM" id="urg-med" />
                        <label htmlFor="urg-med">MEDIUM</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="HIGH" id="urg-high" />
                        <label htmlFor="urg-high">HIGH</label>
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
                <FormLabel>ลิงก์รูปหลักฐาน (ถ้ามี)</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormDescription>วางลิงก์รูปภาพหลักฐานของปัญหา</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 3) ผู้แจ้ง */}
        <div className="space-y-2">
          <h3 className="font-semibold">ข้อมูลผู้แจ้ง</h3>
          {/* Register hidden reporterId so it is included in submission */}
          <input type="hidden" {...form.register("reporterId")} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel>ชื่อผู้แจ้ง</FormLabel>
              <Input value={session?.user?.name ?? ""} readOnly disabled />
            </div>
            <div>
              <FormLabel>อีเมลผู้แจ้ง</FormLabel>
              <Input value={session?.user?.email ?? ""} readOnly disabled />
            </div>
          </div>
          <FormField
            control={form.control}
            name="reporterPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>เบอร์โทร (ถ้ามี)</FormLabel>
                <FormControl>
                  <Input placeholder="08x-xxx-xxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "กำลังส่ง..." : "ส่งฟอร์มแจ้งซ่อม"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
