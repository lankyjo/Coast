"use client";

import React, { useEffect } from "react";

/**
 * Global component to handle keyboard awareness on mobile devices.
 * It listens for focus events and ensures the focused input is scrolled into view.
 */
export const KeyboardAwareness: React.FC = () => {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const isMobileOrTablet = () => {
            return (
                window.matchMedia("(pointer: coarse)").matches ||
                window.innerWidth <= 1024
            );
        };

        const handleFocusIn = (e: FocusEvent) => {
            if (!isMobileOrTablet()) return;

            const target = e.target as HTMLElement;
            const isInput =
                target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            // Filter out non-text inputs
            const isTextInput =
                isInput &&
                !(
                    target instanceof HTMLInputElement &&
                    ["checkbox", "radio", "submit", "button", "range", "file", "color"].includes(
                        target.type
                    )
                );

            if (isTextInput) {
                // Small delay to allow the keyboard to appear
                setTimeout(() => {
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }, 300);
            }
        };

        document.addEventListener("focusin", handleFocusIn);
        return () => {
            document.removeEventListener("focusin", handleFocusIn);
        };
    }, []);

    return null; // This component doesn't render anything
};
