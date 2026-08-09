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



      // Fetch project - search by slug or ID
      let { data: projectData } = await supabase
        .from("projects")
        .select("id, title, description, owner_id, view_count, created_at, slug, genre, is_public")
        .eq("slug", slug)
        .maybeSingle();

      if (!projectData) {
        const { data: idProject } = await supabase
          .from("projects")
          .select("id, title, description, owner_id, view_count, created_at, slug, genre, is_public")
          .eq("id", slug)
          .maybeSingle();
        projectData = idProject;
      }

      if (!projectData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // If story is private, check if current user is owner or an allowed private reader
      if (!projectData.is_public) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const isOwner = projectData.owner_id === user.id;
        if (!isOwner) {
          const { data: readerProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

          const rName = readerProfile?.username || "";

          const userEmail = user.email || "";

          const { data: allowedMembers } = await supabase
            .from("project_members")
            .select("id")
            .eq("project_id", projectData.id)
            .eq("status", "accepted")
            .or(`user_id.eq."${user.id}"${userEmail ? `,invited_email.eq."${userEmail}"` : ""}${rName ? `,invited_email.eq."${rName}"` : ""}`);

          if (!allowedMembers || allowedMembers.length === 0) {
            setNotFound(true);
            setLoading(false);
            return;
          }
        }
      }

      // Get owner profile separately
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", projectData.owner_id)
        .single();



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


      setModules(modulesWithPhases);
    } catch (err) {
      console.error(" Error loading story:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06070a] text-white flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md animate-pulse outfit">
          N
        </div>
        <div className="text-sm font-medium text-slate-400">Loading manuscript...</div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-[#06070a] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="text-5xl">📖</div>
          <h1 className="text-3xl font-extrabold outfit">Story Not Found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            This manuscript may be set to private by the author or the public URL slug might have changed.
          </p>
          <a
            href="/community"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit shadow-lg shadow-indigo-500/20"
          >
            Explore Community Stories
          </a>
        </div>
      </div>
    );
  }

  return <PublicStoryView project={project} modules={modules} />;
}