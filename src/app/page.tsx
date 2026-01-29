"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/lobby");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700">
      <div className="text-white text-2xl font-bold">
        Loading Monopoly Money...
      </div>
    </div>
  );
}
