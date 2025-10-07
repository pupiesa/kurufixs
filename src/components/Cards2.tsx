import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AlertCircleIcon, CircleSmall } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Cards = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Status Changes</CardTitle>
        <ul className="flex flex-col gap-2">
          <li className="flex flex-row justify-between">
            <CardContent>
              Laptop - Room 201
              <CardDescription>Card Footer</CardDescription>
            </CardContent>
            <div className="w-30% max-w-lg">
              <Alert className="rounded-full">
                <CircleSmall className="fill-foreground rounded-full" />
                <AlertTitle>Please </AlertTitle>
                <AlertDescription></AlertDescription>
              </Alert>
            </div>
          </li>
          <li className="flex flex-row justify-between">
            <CardContent>
              Laptop - Room 201
              <CardDescription>Card Footer</CardDescription>
            </CardContent>
            <div className="w-30% max-w-lg">
              <Alert className="rounded-full">
                <CircleSmall className="fill-foreground rounded-full" />
                <AlertTitle>Please </AlertTitle>
                <AlertDescription></AlertDescription>
              </Alert>
            </div>
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
