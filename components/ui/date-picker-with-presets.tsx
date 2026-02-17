"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DatePickerWithPresetsProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export function DatePickerWithPresets({ date, setDate }: DatePickerWithPresetsProps) {
    const [currentMonth, setCurrentMonth] = React.useState<Date>(
        date ? new Date(date) : new Date()
    )

    // Presets logic
    const handlePresetSelect = (value: string) => {
        const daysToAdd = parseInt(value);
        const newDate = addDays(new Date(), daysToAdd);
        setDate(newDate);
        setCurrentMonth(new Date(newDate)); // Move calendar view to selected date
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-auto flex-col space-y-2 p-2" align="start">
                <Select
                    onValueChange={handlePresetSelect}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Quick select..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="0">Today</SelectItem>
                        <SelectItem value="1">Tomorrow</SelectItem>
                        <SelectItem value="3">In 3 days</SelectItem>
                        <SelectItem value="7">In a week</SelectItem>
                        <SelectItem value="14">In 2 weeks</SelectItem>
                    </SelectContent>
                </Select>
                <div className="rounded-md border">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
