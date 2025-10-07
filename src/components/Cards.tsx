import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench } from "lucide-react";

const Cards2 = () => {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Total Equipment</CardTitle>
        <CardTitle className="text-5xl font-bold">50</CardTitle>
        <CardDescription>Card Footer</CardDescription>
        <CardAction>
          <Wrench className="text-blue-400" />
        </CardAction>
      </CardHeader>
    </Card>
  );
};

export default Cards2;
