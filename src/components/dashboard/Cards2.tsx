import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CircleSmall } from "lucide-react";
import { Badge } from "../ui/badge";
const Cards = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Status Changes</CardTitle>
        <ul className="flex flex-col gap-2">
          <li className="flex items-center justify-between gap-4">
            <CardContent>
              Laptop - Room 201
              <CardDescription>Card Footer</CardDescription>
            </CardContent>
            <Badge variant="destructive">
              <CircleSmall className="text-foreground fill-foreground rounded-full" />
              Default
            </Badge>
          </li>
        </ul>
        {/* <CardAction>
          <Wrench className="text-blue-400" />
        </CardAction> */}
      </CardHeader>
    </Card>
  );
};

export default Cards;
