"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-editor";
import { getAllAdminBlogsAction } from "@/app/admin-actions";

export default function EditAdminBlogPage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const res = await getAllAdminBlogsAction();
        if (res.ok && res.data) {
          const found = res.data.find((p: any) => p.slug === slug);
          if (found) setPost(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2"></div>
        <p className="text-xs">Loading article details...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-900">Blog post not found.</p>
      </div>
    );
  }

  return <BlogEditor initialPost={post} isNew={false} />;
}
