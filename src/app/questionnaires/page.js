"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Dashboard() {
  const [questionnaires, setQuestionnaires] = useState([]);
  // const router = useRouter();

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      const { data, error } = await supabase
        .from("questionnaires")
        .select("id, name")
        .order("id", { ascending: true });

      if (error) {
        console.log("Error fetching questionnaires:", error);
      } else {
        setQuestionnaires(data);
      }
    };

    fetchQuestionnaires();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Questionnaires</h1>
      <ul className="space-y-2">
        {questionnaires.map((q) => (
          <li key={q.id}>
            <Link href={`/questionnaires/${q.id}`}>{q.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
