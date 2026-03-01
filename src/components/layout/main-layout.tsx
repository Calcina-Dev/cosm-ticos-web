import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandMenu } from "@/components/command-menu";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar className="hidden w-64 md:block" />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
            <CommandMenu />
        </div>
    );
}
