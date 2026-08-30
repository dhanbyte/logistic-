"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteAdminBlogAction, getAllAdminBlogsAction } from "@/app/admin-actions";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  async function loadBlogs() {
    setLoading(true);
    try {
      const res = await getAllAdminBlogsAction();
      if (res.ok && res.data) {
        setBlogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlogs();
  }, []);

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Are you sure you want to delete blog "${title}"?`)) return;
    setDeletingSlug(slug);
    try {
      const res = await deleteAdminBlogAction(slug);
      if (res.ok) {
        toast.success("Blog deleted successfully!");
        setBlogs((prev) => prev.filter((b) => b.slug !== slug));
      } else {
        toast.error("Failed to delete blog.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete blog.");
    } finally {
      setDeletingSlug(null);
    }
  }

  const filtered = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              Content & SEO Engine
            </span>
            <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              {blogs.length} PUBLISHED ARTICLES
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            Blog Post Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, edit and manage SEO-optimized logistics blog posts. Changes reflect instantly on Shipwave.in/blog.
          </p>
        </div>

        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Write New Blog Post</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title, topic, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
          />
        </div>
        <Link
          href="/blog"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
        >
          <span>View Public Blog Page</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Blogs List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2"></div>
          <p className="text-xs">Loading blog posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No blog posts found</h3>
          <p className="text-xs text-slate-500">Start writing high-converting logistics content to rank on Google.</p>
          <Link
            href="/admin/blogs/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            <Plus size={14} />
            <span>Create Article</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <div
              key={post.slug}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* Category & Date */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-bold text-indigo-700">
                    {post.category}
                  </span>
                  <span className="text-slate-400 font-medium">{post.publishedAt}</span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {post.tags?.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags?.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{post.tags.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900"
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/blogs/${post.slug}`}
                    className="rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 flex items-center gap-1"
                  >
                    <Edit size={12} />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    disabled={deletingSlug === post.slug}
                    onClick={() => handleDelete(post.slug, post.title)}
                    className="rounded-lg border border-rose-200 hover:bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
