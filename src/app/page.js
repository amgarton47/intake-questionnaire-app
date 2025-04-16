"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the login page once the component mounts
    router.push("/login");
  }, [router]);

  return null; // Render nothing as we are redirecting
}
