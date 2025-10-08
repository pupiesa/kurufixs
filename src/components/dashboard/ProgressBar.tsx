"use client";
import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { dir } from "console";
export default function ProgressBar() {
  const [progress, setProgress] = React.useState(13);
  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        // alignSelf: "flex-start",
        width: "100%",
        fontSize: "14px",
        lineHeight: "1.5",
        letterSpacing: "normal",
      }}
    >
      <div>test</div>

      <Progress value={progress} className="w-[60%] place-self-center" />
    </div>
  );
}
