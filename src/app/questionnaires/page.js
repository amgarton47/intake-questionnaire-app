"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Dashboard() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      router.push("/login");
      return;
    }

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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Available Questionnaires
      </h1>
      <ul className="space-y-4">
        {questionnaires.map((q) => (
          <li
            key={q.id}
            className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-100 transition"
          >
            <Link
              href={`/questionnaires/${q.id}`}
              className="text-xl font-medium text-blue-600 hover:text-blue-800 transition duration-200"
            >
              {q.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
