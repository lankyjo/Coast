"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui.store";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export function Header() {
    const pathname = usePathname();
    const { setMobileSheetOpen } = useUIStore();

    const segments = pathname.split("/").filter((segment) => segment !== "");

    const getLabel = (segment: string) => {
        return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={() => setMobileSheetOpen(true)}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
            </Button>

            <div className="flex flex-1 items-center gap-4 md:gap-8">
                {/* Desktop Breadcrumbs */}
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        {segments.map((segment, index) => {
                            const href = `/${segments.slice(0, index + 1).join("/")}`;
                            const isLast = index === segments.length - 1;
                            return (
                                <React.Fragment key={href}>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{getLabel(segment)}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={href}>{getLabel(segment)}</BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Mobile Header Title */}
                <span className="font-semibold md:hidden">
                    {segments.length > 0 ? getLabel(segments[segments.length - 1]) : "Coast"}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell />
            </div>
        </header>
    );
}
