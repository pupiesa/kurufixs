"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = z.object({
  assetId: z.string().min(1, "กรุณาเลือกครุภัณฑ์"),
  issueTitle: z.string().min(2, "กรุณากรอกหัวข้อปัญหา"),
  issueDescription: z.string().min(4, "กรุณาระบุรายละเอียด"),
  issueCategory: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  imageUrl: z.string().url().optional().or(z.literal("")),

  reporterId: z.string().optional().nullable(),
  reporterName: z.string().min(1, "กรอกชื่อผู้แจ้ง"),
  reporterEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  reporterPhone: z.string().optional(),
});

export default function Reportform({ assets = [] }) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      assetId: "",
      issueTitle: "",
      issueDescription: "",
      issueCategory: "",
      urgency: "MEDIUM",
      imageUrl: "",
      reporterId: session?.user?.id ?? null,
      reporterName: session?.user?.name ?? "",
      reporterEmail: session?.user?.email ?? "",
      reporterPhone: "",
    },
    mode: "onChange",
  });

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === form.watch("assetId")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, form.watch("assetId")]
  );

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.message || "บันทึกไม่สำเร็จ");
      } else {
        form.reset({
          assetId: "",
          issueTitle: "",
          issueDescription: "",
          issueCategory: "",
          urgency: "MEDIUM",
          imageUrl: "",
          reporterId: session?.user?.id ?? null,
          reporterName: session?.user?.name ?? "",
          reporterEmail: session?.user?.email ?? "",
          reporterPhone: "",
        });
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
          <input type="hidden" value={form.getValues("reporterId") ?? ""} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="reporterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้แจ้ง</FormLabel>
                  <FormControl>
                    <Input placeholder="ชื่อ-นามสกุล" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reporterEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อีเมลผู้แจ้ง</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@kmitl.ac.th"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
