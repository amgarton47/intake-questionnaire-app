"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/questionnaires");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (data) {
      // Store user info in local storage
      localStorage.setItem("user", JSON.stringify(data));

      // Redirect user based on role
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/questionnaires");
      }
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username:{" "}
          </label>
          <input
            type="text"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb4" //mb-4
          ></input>

          <label>Password: </label>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></input>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font medium"
          >
            Login
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
