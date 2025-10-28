"use client";
import type React from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className }) => {
  return (
    <Progress
      value={value}
      className="bg-muted"
      indicatorClassName={className}
    />
  );
};

export default ProgressBar;
