"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"solo" | "team">("solo");
  const router = useRouter();

  const handleCreate = async () => {
    if (!name) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        type,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/dashboard/${data.id}`);
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-3xl font-bold mb-6">Create New Story</h2>

      <div className="space-y-4">
        <input
          placeholder="Story title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
        />

        <textarea
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
        />

        <div className="flex gap-4">
          <button
            onClick={() => setType("solo")}
            className={`px-4 py-2 rounded-lg ${
              type === "solo" ? "bg-indigo-600" : "bg-gray-800"
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => setType("team")}
            className={`px-4 py-2 rounded-lg ${
              type === "team" ? "bg-indigo-600" : "bg-gray-800"
            }`}
          >
            Team
          </button>
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-lg font-semibold"
        >
          Create Story
        </button>
      </div>
    </div>
  );
}
