import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "../lib/utils"; // Assuming lib/utils is in the same directory as components
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { Label } from "@radix-ui/react-dropdown-menu";

interface DateTimePickerFieldProps {
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function DateTimePickerField({
  value,
  onValueChange,
  label,
  description,
  className,
}: DateTimePickerFieldProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve existing time if a date is selected
      const currentDateTime = value || new Date();
      date.setHours(currentDateTime.getHours());
      date.setMinutes(currentDateTime.getMinutes());
      onValueChange(date);
    } else {
      onValueChange(undefined);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", timeValue: string) => {
    const currentDateTime = value || new Date();
    let newDate = new Date(currentDateTime);

    if (type === "hour") {
      const hour = parseInt(timeValue, 10);
      newDate.setHours(hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(timeValue, 10));
    }
    onValueChange(newDate);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {label && <Label className="mb-1">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {value ? (
              format(value, "MM/dd/yyyy HH:mm")
            ) : (
              <span>MM/DD/YYYY HH:mm</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 24 }, (_, i) => i)
                    .reverse()
                    .map((hour) => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          value && value.getHours() === hour
                            ? "default"
                            : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() => handleTimeChange("hour", hour.toString())}
                      >
                        {hour}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map(
                    (minute) => (
                      <Button
                        key={minute}
                        size="icon"
                        variant={
                          value && value.getMinutes() === minute
                            ? "default"
                            : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() =>
                          handleTimeChange("minute", minute.toString())
                        }
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    )
                  )}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
