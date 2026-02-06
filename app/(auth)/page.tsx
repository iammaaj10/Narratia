"use client";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Your Stories</h2>
      <p className="text-gray-400 mb-8">
        You haven’t created any stories yet.
      </p>

      <button
        onClick={() => router.push("/dashboard/new-project")}
        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold"
      >
        Create your first story
      </button>
    </div>
  );
}
