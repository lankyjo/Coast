"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomBoardStore } from "@/stores/custom-board.store";
import {
    Layout,
    Plus,
    ChevronDown,
    ChevronRight,
    Search,
    Hash,
    Briefcase,
    Target,
    ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AddCustomBoardDialog } from "../board/AddCustomBoardDialog";

const iconMap: any = {
    Layout,
    Briefcase,
    Target,
    ListTodo,
    Hash
};

interface SidebarBoardsProps {
    collapsed: boolean;
}

export function SidebarBoards({ collapsed }: SidebarBoardsProps) {
    const pathname = usePathname();
    const { boards, isLoading, fetchBoards } = useCustomBoardStore();
    const [isOpen, setIsOpen] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    if (collapsed) {
        return (
            <div className="flex flex-col items-center gap-1 px-2 pt-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Create New Board</TooltipContent>
                </Tooltip>

                {boards.map((board) => {
                    const isActive = pathname === `/boards/${(board._id as unknown as string)}`;
                    const Icon = iconMap[board.icon || "Layout"] || Layout;
                    return (
                        <Tooltip key={board._id as unknown as string}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/boards/${(board._id as unknown as string)}`}
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{board.name}</TooltipContent>
                        </Tooltip>
                    );
                })}
                <AddCustomBoardDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
            </div>
        );
    }

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between px-3 mb-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>My Boards</span>
                </button>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Create Board"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>

            {isOpen && (
                <div className="grid gap-1 px-2">
                    {boards.length === 0 && !isLoading && (
                        <p className="px-3 py-2 text-[10px] text-muted-foreground italic">
                            No custom boards yet
                        </p>
                    )}

                    {boards.map((board) => {
                        const isActive = pathname === `/boards/${(board._id as unknown as string)}`;
                        const Icon = iconMap[board.icon || "Layout"] || Layout;
                        return (
                            <Link
                                key={board._id as unknown as string}
                                href={`/boards/${(board._id as unknown as string)}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                    isActive
                                        ? "bg-muted text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
                                <span className="truncate">{board.name}</span>
                            </Link>
                        );
                    })}
                </div>
            )}

            <AddCustomBoardDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
        </div>
    );
}
