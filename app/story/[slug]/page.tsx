"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import PublicStoryView from "./PublicStoryView";

type Project = {
  id: string;
  title: string;
  description: string | null;
  view_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

type Phase = {
  id: string;
  title: string;
  description: string | null;
  content: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  phases: Phase[];
};

export default function PublicStoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      loadStory();
    }
  }, [slug]);

  const loadStory = async () => {
    try {
      setLoading(true);

      console.log("🔍 Looking for slug:", slug);

      // Fetch public project - simpler query first
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .single();

      console.log("📦 Project data:", projectData);
      console.log("❌ Project error:", projectError);

      if (projectError || !projectData) {
        console.error("❌ Project not found");
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Get owner profile separately
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", projectData.owner_id)
        .single();

      console.log("👤 Owner profile:", ownerProfile);

      // Combine project with profile
      const fullProject: Project = {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        view_count: projectData.view_count || 0,
        created_at: projectData.created_at,
        profiles: ownerProfile || {
          username: "Unknown",
          avatar_url: null,
        },
      };

      setProject(fullProject);

      // Track view (fire and forget)
      supabase.from("story_views").insert({
        project_id: projectData.id,
        viewer_ip: null,
        viewer_country: null,
      }).then(() => {
        // Increment view count
        supabase.rpc("increment_view_count", {
          project_id: projectData.id,
        });
      });

      // Fetch modules
      const { data: modulesData } = await supabase
        .from("modules")
        .select("id, title, description, created_at")
        .eq("project_id", projectData.id)
        .order("created_at", { ascending: true });

      console.log("📚 Modules:", modulesData);

      // Fetch phases for each module
      const modulesWithPhases = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: phases } = await supabase
            .from("phases")
            .select("id, title, description, content, created_at")
            .eq("module_id", module.id)
            .order("created_at", { ascending: true });

          return {
            ...module,
            phases: phases || [],
          };
        })
      );

      console.log("📖 Modules with phases:", modulesWithPhases);
      setModules(modulesWithPhases);
    } catch (err) {
      console.error("❌ Error loading story:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading story...</div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400 text-xl">Story not found</p>
          <p className="text-gray-500 text-sm mt-2">
            This story may be private or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return <PublicStoryView project={project} modules={modules} />;
}