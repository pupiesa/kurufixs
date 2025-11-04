import { AlertTriangle, Wrench } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/db";
import { ReportStatus, Urgency } from "@prisma/client";

type Props = {
  /** Card title (shown at the top) */
  title: string;
  /** Short description under the number */
  desc: string;
  /** If provided, use this number directly. If omitted and variant="urgent", we'll query DB. */
  total?: number;
  /** "urgent" switches icon/styling and (if total not provided) auto-counts HIGH urgency */
  variant?: "default" | "urgent";
};

/** Dashboard summary card */
const Cards = async ({ title, desc, total, variant = "default" }: Props) => {
  // Use provided total if present; otherwise, compute when variant="urgent"
  const value =
    typeof total === "number"
      ? total
      : variant === "urgent"
      ? await prisma.repairReport.count({
          where: {
            urgency: Urgency.HIGH,
            status: { in: [ReportStatus.PENDING, ReportStatus.IN_PROGRESS] },
          },
        })
      : 0;

  const Icon = variant === "urgent" ? AlertTriangle : Wrench;
  const iconClass = variant === "urgent" ? "text-red-500" : "text-blue-400";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardTitle className="text-5xl font-bold">{value}</CardTitle>
        <CardDescription>{desc}</CardDescription>
        <CardAction>
          <Icon className={iconClass} />
        </CardAction>
      </CardHeader>
    </Card>
  );
};

export default Cards;
