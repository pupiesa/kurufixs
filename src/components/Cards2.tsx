import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Cards = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Status Changes</CardTitle>
        <div className="flex flex-row justify-between">
          <CardContent>
            Laptop - Room 201
            <CardDescription>Card Footer</CardDescription>
          </CardContent>
          <div className="w-30% max-w-lg">
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Please </AlertTitle>
              <AlertDescription></AlertDescription>
            </Alert>
          </div>
        </div>
        {/* <CardAction>
          <Wrench className="text-blue-400" />
        </CardAction> */}
      </CardHeader>
    </Card>
  );
};

export default Cards;
