// src/app/admin/addasset/page.tsx
// Server Component (ไม่มี "use client")
import { Prisma } from "@prisma/client";
import * as DB from "@/lib/db";
import { redirect } from "next/navigation";

const prisma: any = (DB as any).prisma ?? (DB as any).db;

/* ----------------------------- UI helpers ----------------------------- */
const baseCard =
  "rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 shadow-sm backdrop-blur-sm";
const baseInput =
  "w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus:border-white/20 placeholder:text-muted-foreground/70 transition";
const baseInputErr =
  baseInput + " border-red-300 focus-visible:ring-red-500/60";
const baseSelect =
  "w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus:border-white/20 transition";

/* ---------------------------- Schema helpers --------------------------- */
function camelDelegate(modelName: string) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}
function pickModelName(dmmf: typeof Prisma.dmmf): string | null {
  const models = dmmf.datamodel.models;
  const candidates = [
    "Asset",
    "Assets",
    "Durable",
    "DurableGood",
    "DurableGoods",
    "Equipment",
    "Inventory",
    "Device",
  ];
  for (const want of candidates)
    if (models.some((m) => m.name === want)) return want;
  const byName = models.find((m) =>
    m.fields.some((f) => f.name.toLowerCase() === "name" && f.type === "String")
  );
  return byName?.name ?? null;
}
function coerceValue(type: string, value: any) {
  if (value === "" || value === undefined || value === null) return null;
  switch (type) {
    case "Int":
    case "BigInt":
      return Number.isFinite(value)
        ? Number(value)
        : parseInt(String(value), 10);
    case "Float":
    case "Decimal":
      return String(value);
    case "Boolean": {
      if (typeof value === "boolean") return value;
      const s = String(value).toLowerCase();
      return s === "true" || s === "1" || s === "yes" || s === "on";
    }
    case "DateTime": {
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? null : d;
    }
    default:
      return value;
  }
}
function guessLabelKey(obj: Record<string, any>): string {
  const pref = [
    "name",
    "title",
    "fullName",
    "code",
    "assetName",
    "displayName",
    "email",
    "username",
  ];
  for (const k of pref) if (k in obj && typeof obj[k] === "string") return k;
  const firstStr = Object.keys(obj).find((k) => typeof obj[k] === "string");
  return firstStr ?? "id";
}
function placeholderForField(name: string, type: string): string {
  const low = name.toLowerCase();
  if (low.includes("code")) return "เช่น AS-2025-001";
  if (low.includes("name")) return "เช่น จอภาพ 27 นิ้ว";
  if (low.includes("brand")) return "เช่น Samsung";
  if (low.includes("model")) return "เช่น LS27C33";
  if (low.includes("serial")) return "เช่น SN123456789";
  if (low.includes("price")) return "เช่น 25000.00";
  if (type === "Int" || type === "BigInt") return "กรอกตัวเลข เช่น 10";
  if (type === "Float" || type === "Decimal") return "กรอกจำนวน เช่น 1999.50";
  return "(ไม่บังคับ)";
}

/* ลำดับความสำคัญ (ฟอร์มเดียว ไม่มีหมวดหมู่) */
const priorityOrder = [
  "assetCode",
  "code",
  "assetName",
  "name",
  "brand",
  "model",
  "serialNo",
  "serial",
  "purchaseDate",
  "price",
  "warrantyExp",
];

/* ---------------------------- Server Action ---------------------------- */
async function createAssetAction(formData: FormData) {
  "use server";
  const dmmf = Prisma.dmmf;
  const modelName = pickModelName(dmmf);
  if (!modelName) throw new Error("ไม่พบโมเดลครุภัณฑ์ใน Prisma schema");
  const model = dmmf.datamodel.models.find((m) => m.name === modelName)!;

  const relationFields = model.fields.filter(
    (f) => f.kind === "object" && !f.isList
  ) as any[];
  const relationFKs = new Set<string>();
  for (const rel of relationFields)
    (rel.relationFromFields ?? []).forEach((fk: string) => relationFKs.add(fk));

  // 0) Pre-check: unique one-field (กัน error ก่อนยิง create)
  const uniqueOneFields = model.fields.filter(
    (f: any) => f.kind === "scalar" && f.isUnique === true
  );
  for (const f of uniqueOneFields) {
    const val = formData.get(f.name);
    if (val && String(val).trim() !== "") {
      const d = prisma?.[camelDelegate(modelName)];
      if (d?.findUnique) {
        const exists = await d
          .findUnique({ where: { [f.name]: String(val) } })
          .catch(() => null);
        if (exists) {
          const v = encodeURIComponent(String(val));
          const field = encodeURIComponent(f.name);
          redirect(`/admin/addasset?dupe=1&field=${field}&v=${v}`);
        }
      }
    }
  }

  // 1) scalar/enum (ไม่ตั้งค่า FK ตรงๆ, ไม่รวม helper building/room)
  const createData: Record<string, any> = {};
  for (const f of model.fields) {
    if (!["scalar", "enum"].includes(f.kind)) continue;
    if (f.isId || (f as any).isReadOnly || (f as any).isUpdatedAt) continue;
    const lname = f.name.toLowerCase();
    if (lname === "createdat" || lname === "updatedat") continue;
    if (relationFKs.has(f.name)) continue;
    if (f.name === "building" || f.name === "room") continue;

    let raw: any = formData.get(f.name);
    if (f.type === "Json") {
      const s = String(raw ?? "").trim();
      raw = s
        ? (() => {
            try {
              return JSON.parse(s);
            } catch {
              return s;
            }
          })()
        : null;
    }
    const v = coerceValue(String(f.type), raw);
    if (v !== null) createData[f.name] = v;
    else if (f.isRequired && !(f as any).hasDefaultValue)
      throw new Error(`ฟิลด์ "${f.name}" เป็นฟิลด์บังคับ`);
  }

  // 2) relations (connect เสมอ) + ล็อกสถานะ “ใช้งานอยู่”
  for (const rel of relationFields) {
    const relName: string = rel.name;
    const relModel: string = rel.type;
    const to: string[] = rel.relationToFields ?? [];
    const toKey = to[0] ?? "id";

    const isStatus =
      relName.toLowerCase().includes("status") ||
      relModel.toLowerCase().includes("status");
    const isStaff =
      relName.toLowerCase().includes("staff") ||
      relModel.toLowerCase().includes("staff");
    const isLocation =
      relName.toLowerCase().includes("location") ||
      relModel.toLowerCase().includes("location");

    if (isStatus) {
      const d = prisma?.[camelDelegate(relModel)];
      if (!d?.findMany) continue;
      const rows = await d.findMany({ take: 200 });
      const pick =
        rows.find((r: any) => {
          const label = String(r[guessLabelKey(r)] ?? "").toLowerCase();
          return (
            label.includes("ใช้งาน") ||
            label.includes("active") ||
            label.includes("in use")
          );
        }) ?? rows[0];
      if (!pick) throw new Error("ไม่พบรายการ Status ที่จะตั้งค่า");
      createData[relName] = {
        connect: { [toKey]: String(pick[toKey] ?? pick.id) },
      };
      continue;
    }

    if (isStaff) {
      if (rel.isRequired) {
        const d = prisma?.[camelDelegate(relModel)];
        if (d?.findFirst) {
          const first = await d.findFirst();
          if (!first) throw new Error("จำเป็นต้องมี Staff อย่างน้อย 1 รายการ");
          createData[relName] = {
            connect: { [toKey]: String(first[toKey] ?? first.id) },
          };
        }
      }
      continue;
    }

    if (isLocation) {
      const building = String(formData.get("building") ?? "").trim();
      const room = String(formData.get("room") ?? "").trim();

      const locModel = Prisma.dmmf.datamodel.models.find(
        (m) => m.name === relModel
      );
      const locBuildingField =
        locModel?.fields.find(
          (f) =>
            f.kind === "scalar" &&
            f.type === "String" &&
            f.name.toLowerCase() === "building"
        )?.name ?? "building";
      const locRoomField =
        locModel?.fields.find(
          (f) =>
            f.kind === "scalar" &&
            f.type === "String" &&
            f.name.toLowerCase() === "room"
        )?.name ?? "room";

      const d = prisma?.[camelDelegate(relModel)];
      if (!d) continue;

      let target: any = null;
      if (building || room) {
        try {
          target = await d.findFirst({
            where: {
              ...(building ? { [locBuildingField]: building } : {}),
              ...(room ? { [locRoomField]: room } : {}),
            },
          });
        } catch {}
      }
      if (!target && (building || room)) {
        try {
          target = await d.create({
            data: {
              ...(building ? { [locBuildingField]: building } : {}),
              ...(room ? { [locRoomField]: room } : {}),
            },
          });
        } catch {
          if (rel.isRequired)
            throw new Error(
              "ต้องระบุ building/room เพียงพอสำหรับสร้าง Location"
            );
        }
      }
      if (target)
        createData[relName] = {
          connect: { [toKey]: String(target[toKey] ?? target.id) },
        };
      else if (rel.isRequired)
        throw new Error("ต้องระบุ building/room สำหรับ Location");
      continue;
    }

    const formKey = `__rel__${relName}`;
    const picked = formData.get(formKey);
    if (picked && String(picked) !== "") {
      createData[relName] = { connect: { [toKey]: String(picked) } };
    } else if (rel.isRequired) {
      throw new Error(`ต้องเลือก ${relName}`);
    }
  }

  // 3) create → success / handle duplicate gracefully
  const delegate = prisma?.[camelDelegate(modelName)];
  if (!delegate?.create)
    throw new Error(`ไม่พบ Prisma delegate สำหรับโมเดล "${modelName}"`);
  try {
    await delegate.create({ data: createData });
  } catch (e: any) {
    // Prisma P2002: Unique constraint failed
    if (e?.code === "P2002") {
      const target = (e?.meta?.target as string[] | undefined) ?? [];
      const field = encodeURIComponent(target[0] ?? "assetCode");
      const val = encodeURIComponent(
        String(formData.get(target[0] ?? "assetCode") ?? "")
      );
      redirect(`/admin/addasset?dupe=1&field=${field}&v=${val}`);
    }
    throw e;
  }

  redirect("/admin/addasset?ok=1");
}

/* --------------------------------- Page -------------------------------- */
export default async function AddAssetPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const dmmf = Prisma.dmmf;
  const modelName = pickModelName(dmmf);
  if (!modelName) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          ไม่พบโมเดลสำหรับ “ครุภัณฑ์”
        </div>
      </div>
    );
  }

  const okParam = searchParams?.ok;
  const ok = Array.isArray(okParam) ? okParam.includes("1") : okParam === "1";

  const dupe = Array.isArray(searchParams?.dupe)
    ? searchParams?.dupe.includes("1")
    : searchParams?.dupe === "1";
  const dupeField =
    typeof searchParams?.field === "string" ? searchParams?.field : "";
  const dupeValue =
    typeof searchParams?.v === "string"
      ? decodeURIComponent(searchParams?.v)
      : "";

  const model = dmmf.datamodel.models.find((m) => m.name === modelName)!;

  // relations meta
  const relationFields = model.fields.filter(
    (f) => f.kind === "object" && !f.isList
  ) as any[];
  const hasLocationRelation = relationFields.some(
    (rel) =>
      rel.name.toLowerCase().includes("location") ||
      rel.type.toLowerCase().includes("location")
  );

  // relation selects (required only, except status/staff/location)
  type RelMeta = {
    relName: string;
    relModel: string;
    toKey: string;
    rows: Array<{ value: string; label: string }>;
  };
  const relationSelects: RelMeta[] = [];
  for (const rel of relationFields) {
    const relName = rel.name;
    const relModel = rel.type;
    const isStatus =
      relName.toLowerCase().includes("status") ||
      relModel.toLowerCase().includes("status");
    const isStaff =
      relName.toLowerCase().includes("staff") ||
      relModel.toLowerCase().includes("staff");
    const isLocation =
      relName.toLowerCase().includes("location") ||
      relModel.toLowerCase().includes("location");
    if (isStatus || isStaff || isLocation) continue;
    if (!rel.isRequired) continue;

    const toKey = (rel.relationToFields ?? [])[0] ?? "id";
    const d = prisma?.[camelDelegate(relModel)];
    let rows: any[] = [];
    if (d?.findMany) {
      try {
        rows = await d.findMany({ take: 200 });
      } catch {
        rows = [];
      }
    }
    relationSelects.push({
      relName,
      relModel,
      toKey,
      rows: rows.map((r: any) => ({
        value: String(r[toKey] ?? r.id),
        label: String(r[guessLabelKey(r)] ?? r.id),
      })),
    });
  }

  // scalar/enum list (no FKs) and ordering
  const relationFKs = new Set<string>();
  for (const rel of relationFields)
    (rel.relationFromFields ?? []).forEach((fk: string) => relationFKs.add(fk));

  type FieldMeta = {
    name: string;
    type: string;
    kind: "scalar" | "enum";
    isRequired: boolean;
    enumValues: string[];
  };
  const rawFields: FieldMeta[] = model.fields
    .filter((f) => f.kind === "scalar" || f.kind === "enum")
    .filter((f) => {
      if (f.isId || (f as any).isReadOnly || (f as any).isUpdatedAt)
        return false;
      const lname = f.name.toLowerCase();
      if (lname === "createdat" || lname === "updatedat") return false;
      if (relationFKs.has(f.name)) return false;
      return true;
    })
    .map((f) => {
      const enumValues =
        f.kind === "enum"
          ? (
              Prisma.dmmf.datamodel.enums.find((e) => e.name === f.type)
                ?.values ?? []
            ).map((v) => (typeof v === "string" ? v : v.name))
          : [];
      return {
        name: f.name,
        type: String(f.type),
        kind: f.kind as "scalar" | "enum",
        isRequired: f.isRequired,
        enumValues,
      };
    });

  const prioritySet = new Set(priorityOrder.map((s) => s.toLowerCase()));
  const fieldsPriority = rawFields
    .filter((f) => prioritySet.has(f.name.toLowerCase()))
    .sort(
      (a, b) =>
        priorityOrder.findIndex(
          (k) => k.toLowerCase() === a.name.toLowerCase()
        ) -
        priorityOrder.findIndex((k) => k.toLowerCase() === b.name.toLowerCase())
    );
  const fieldsOthers = rawFields
    .filter((f) => !prioritySet.has(f.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function renderScalar(f: FieldMeta, autofocus = false) {
    const label = `${f.name}${f.isRequired ? " *" : ""}`;
    const ph = placeholderForField(f.name, f.type);
    const isDupField =
      dupe && dupeField && dupeField.toLowerCase() === f.name.toLowerCase();
    const defaultVal = isDupField ? dupeValue : undefined;

    if (f.kind === "enum") {
      return (
        <label key={f.name} className="grid gap-1 text-sm">
          <span className="font-medium">{label}</span>
          <select
            name={f.name}
            required={f.isRequired}
            defaultValue=""
            className={baseSelect}
            {...(autofocus ? { autoFocus: true } : {})}
          >
            <option value="" disabled>
              เลือก…
            </option>
            {f.enumValues.map((v) => (
              <option key={v} value={v} className="bg-background">
                {v}
              </option>
            ))}
          </select>
        </label>
      );
    }

    switch (f.type) {
      case "Boolean":
        return (
          <div
            key={f.name}
            className="flex items-center gap-3 text-sm md:col-span-2"
          >
            <input
              id={f.name}
              name={f.name}
              type="checkbox"
              className="size-4 accent-emerald-600"
            />
            <label htmlFor={f.name} className="font-medium">
              {label}
            </label>
          </div>
        );
      case "Int":
      case "BigInt":
      case "Float":
      case "Decimal":
        return (
          <label key={f.name} className="grid gap-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={f.name}
              type="number"
              step="any"
              required={f.isRequired}
              placeholder={ph}
              className={isDupField ? baseInputErr : baseInput}
              defaultValue={defaultVal}
              {...(autofocus ? { autoFocus: true } : {})}
              aria-invalid={isDupField || undefined}
            />
          </label>
        );
      case "DateTime":
        return (
          <label key={f.name} className="grid gap-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={f.name}
              type="date"
              required={f.isRequired}
              className={isDupField ? baseInputErr : baseInput}
              defaultValue={defaultVal}
              {...(autofocus ? { autoFocus: true } : {})}
              aria-invalid={isDupField || undefined}
            />
          </label>
        );
      case "Json":
        return (
          <label key={f.name} className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium">{label}</span>
            <textarea
              name={f.name}
              rows={4}
              placeholder='{"key":"value"}'
              required={f.isRequired}
              className={isDupField ? baseInputErr : baseInput}
              defaultValue={defaultVal}
              aria-invalid={isDupField || undefined}
            />
          </label>
        );
      default:
        return (
          <label key={f.name} className="grid gap-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={f.name}
              type="text"
              required={f.isRequired}
              placeholder={ph}
              className={isDupField ? baseInputErr : baseInput}
              defaultValue={defaultVal}
              {...(autofocus ? { autoFocus: true } : {})}
              aria-invalid={isDupField || undefined}
            />
          </label>
        );
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      {ok && (
        <div
          className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-900"
          aria-live="polite"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
            ✓
          </span>
          <span className="text-sm font-medium">เพิ่มครุภัณฑ์สำเร็จ</span>
          <a
            href="/assets"
            className="ml-auto inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            ไปหน้า Assets
          </a>
        </div>
      )}

      {dupe && (
        <div
          className="mb-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-900"
          aria-live="assertive"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
            !
          </span>
          <span className="text-sm">
            ค่าที่กรอกใน <b>{dupeField || "รหัส"}</b> ถูกใช้ไปแล้ว
            กรุณาเปลี่ยนเป็นค่าใหม่ที่ไม่ซ้ำ
            {dupeValue ? (
              <>
                {" "}
                (เดิม: <code className="mx-1">{dupeValue}</code>)
              </>
            ) : null}
          </span>
        </div>
      )}

      <div className={baseCard}>
        <div className="mb-4 flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold">เพิ่มครุภัณฑ์</h2>
            <p className="text-xs text-muted-foreground">
              กรอกจากบนลงล่าง ช่องที่มี * จำเป็น
            </p>
          </div>
        </div>

        <form action={createAssetAction} className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fieldsPriority.map((f, idx) => {
              const autofocus = dupe
                ? dupeField.toLowerCase() === f.name.toLowerCase()
                : idx === 0;
              return renderScalar(f, autofocus);
            })}

            {relationSelects.map((r) => (
              <label key={r.relName} className="grid gap-1 text-sm">
                <span className="font-medium">{r.relName} *</span>
                <select
                  name={`__rel__${r.relName}`}
                  required
                  defaultValue=""
                  className={baseSelect}
                >
                  <option value="" disabled>
                    เลือก…
                  </option>
                  {r.rows.map((row) => (
                    <option
                      key={row.value}
                      value={row.value}
                      className="bg-background"
                    >
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {hasLocationRelation && (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">building</span>
                  <input
                    name="building"
                    type="text"
                    placeholder="เช่น อาคาร A"
                    className={baseInput}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">room</span>
                  <input
                    name="room"
                    type="text"
                    placeholder="เช่น ห้อง 201"
                    className={baseInput}
                  />
                </label>
              </>
            )}

            {fieldsOthers.map((f) => renderScalar(f))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              บันทึกครุภัณฑ์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
