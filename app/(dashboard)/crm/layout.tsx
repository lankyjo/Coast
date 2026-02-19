import { requireAdmin } from "@/actions/auth.actions";
import { redirect } from "next/navigation";

export default async function CrmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    try {
        await requireAdmin();
    } catch {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
