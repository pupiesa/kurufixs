"use client";
import { Progress } from "@/components/ui/progress";
import React from "react";

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
