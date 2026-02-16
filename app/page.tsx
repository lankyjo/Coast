import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function GatewayPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)]" />

      {/* Floating dots decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-1 w-1 rounded-full bg-white/10 animate-pulse" />
        <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-white/5 animate-pulse delay-700" />
        <div className="absolute bottom-1/4 left-1/3 h-1 w-1 rounded-full bg-white/10 animate-pulse delay-1000" />
        <div className="absolute top-2/3 right-1/4 h-1 w-1 rounded-full bg-white/5 animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2C7.37 2 2 7.37 2 14s5.37 12 12 12 12-5.37 12-12S20.63 2 14 2zm0 21.5c-1.1 0-2.14-.18-3.12-.52A15.5 15.5 0 0014 18c1.1 0 2.16.16 3.12.48-.98.34-2.02.52-3.12.52zm5.87-2.13A17.5 17.5 0 0014 20a17.5 17.5 0 00-5.87 1.37A9.44 9.44 0 014.5 14c0-5.24 4.26-9.5 9.5-9.5s9.5 4.26 9.5 9.5a9.44 9.44 0 01-3.63 7.37z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The Coast
          </h1>
          <p className="max-w-sm text-base font-light leading-relaxed text-white/40">
            Internal project management for the team.
          </p>
        </div>

        {/* CTA */}
        <Button asChild size="lg" className="h-12 rounded-xl bg-white text-black hover:bg-white/90">
          <Link href="/login">
            Team Login <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        {/* Footer */}
        <p className="mt-8 text-xs text-white/20">
          Authorized personnel only
        </p>
      </div>
    </main>
  );
}
