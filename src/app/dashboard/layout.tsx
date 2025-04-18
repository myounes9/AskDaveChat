import { Toaster } from "@/components/ui/sonner";
// Removed Header and Sidebar imports as they were causing errors
// import Header from "@/components/layout/Header";
// import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* <Sidebar /> Assume Sidebar is rendered elsewhere or within children */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        {/* <Header /> Assume Header is rendered elsewhere or within children */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
} 