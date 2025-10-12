import { Wrench } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Cards2Props {
  total: number;
  title: string;
  desc: string;
}

const Cards2 = (props: Cards2Props) => {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardTitle className="text-5xl font-bold">{props.total}</CardTitle>
        <CardDescription>{props.desc}</CardDescription>
        <CardAction>
          <Wrench className="text-blue-400" />
        </CardAction>
      </CardHeader>
    </Card>
  );
};

export default Cards2;
