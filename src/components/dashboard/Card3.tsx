import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ProgressBar from "@/components/dashboard/ProgressBar";
const Cards = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Equipment Status Overview</CardTitle>
        <ul className="flex flex-col gap-2">
          <li className="flex items-center justify-between gap-4">
            <CardContent>Laptop - Room 201</CardContent>
            <div className="shrink-0 w-[80px] sm:w-[80px]">
              <ProgressBar />
            </div>
          </li>
        </ul>
      </CardHeader>
    </Card>
  );
};

export default Cards;
