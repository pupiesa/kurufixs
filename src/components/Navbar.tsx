"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbars = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getDisplayName = (path: string) => {
    switch (path) {
      case "/":
        return "Dashboard";
      case "/status":
        return "Status";
      case "/reports":
        return "Reports";
      case "/assets":
        return "Assets";
      default:
        return "Dashboard";
    }
  };

  if (!mounted) {
    // Render a stable placeholder for both SSR and first client render
    return <div className="h-10" />;
  }

  const displayName = getDisplayName(pathname);

  const Buttons: React.FC = () => (
    <Button variant="default" className="w-32">
      <Plus />
      New Request
    </Button>
  );

  return (
    <div className="flex justify-around px-4">
      <div className="basis-full">
        <h6 className="text-4xl font-bold">{displayName}</h6>
      </div>
      <Link href="/reports" className="mr-4">
        <Buttons />
      </Link>
    </div>
  );
};

export default Navbars;
