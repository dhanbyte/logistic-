"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  FileText,
  Image,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { saveAdminBlogAction } from "@/app/admin-actions";

export interface BlogEditorProps {
  initialPost?: {
    slug?: string;
    title?: string;
    excerpt?: string;
    category?: string;
    readTime?: string;
    publishedAt?: string;
    author?: {
      name?: string;
      role?: string;
      avatar?: string;
    };
    featuredImage?: string;
    tags?: string[];
    content?: string[];
    keyTakeaways?: string[];
  };
  isNew?: boolean;
}

export function BlogEditor({ initialPost, isNew = false }: BlogEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [category, setCategory] = useState(initialPost?.category || "RTO Management");
  const [readTime, setReadTime] = useState(initialPost?.readTime || "5 min read");
  const [publishedAt, setPublishedAt] = useState(
    initialPost?.publishedAt || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  );
  const [authorName, setAuthorName] = useState(initialPost?.author?.name || "Dhananjay Singh");
  const [authorRole, setAuthorRole] = useState(initialPost?.author?.role || "Logistics Specialist");
  const [authorAvatar, setAuthorAvatar] = useState(
    initialPost?.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  );
  const [featuredImage, setFeaturedImage] = useState(
    initialPost?.featuredImage || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80",
  );
  const [tagsInput, setTagsInput] = useState((initialPost?.tags || ["Logistics", "Ecommerce", "Shipping"]).join(", "));
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialPost?.keyTakeaways || ["Key takeaway 1", "Key takeaway 2"],
  );
  const [contentParagraphs, setContentParagraphs] = useState<string[]>(
    initialPost?.content || ["First paragraph of the logistics article..."],
  );

  function handleTitleChange(val: string) {
    setTitle(val);
    if (isNew || !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  }

  function addTakeaway() {
    setKeyTakeaways((prev) => [...prev, ""]);
  }

  function updateTakeaway(index: number, val: string) {
    setKeyTakeaways((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }

  function removeTakeaway(index: number) {
    setKeyTakeaways((prev) => prev.filter((_, i) => i !== index));
  }

  function addParagraph() {
    setContentParagraphs((prev) => [...prev, ""]);
  }

  function updateParagraph(index: number, val: string) {
    setContentParagraphs((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }

  function removeParagraph(index: number) {
    setContentParagraphs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and Slug are required.");
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const postPayload = {
        slug: slug.trim(),
        title: title.trim(),
        excerpt: excerpt.trim(),
        category,
        categoryColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        readTime,
        publishedAt,
        author: {
          name: authorName,
          role: authorRole,
          avatar: authorAvatar,
        },
        featuredImage,
        tags,
        content: contentParagraphs.filter((p) => p.trim().length > 0),
        keyTakeaways: keyTakeaways.filter((k) => k.trim().length > 0),
      };

      const res = await saveAdminBlogAction(postPayload);
      if (res.ok) {
        toast.success(res.message || "Blog post saved successfully!");
        router.push("/admin/blogs");
      } else {
        toast.error(res.message || "Failed to save blog.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving blog post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blogs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          <span>Back to Blog List</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isNew && slug && (
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs"
            >
              <Eye size={14} />
              <span>Preview Live</span>
            </Link>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {saving ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Save size={16} />}
            <span>{isNew ? "Publish Article" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* Title & Slug */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
              Article Title *
            </label>
            <input
              type="text"
              placeholder="e.g. How Indian D2C Brands Can Reduce RTO by 38% Using WhatsApp Automation"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-base font-bold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
                URL Slug (SEO Permalink) *
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono text-slate-500 focus-within:border-indigo-600 focus-within:bg-white">
                <span className="text-slate-400">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-transparent font-bold text-indigo-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
              >
                <option value="RTO Management">RTO Management</option>
                <option value="Courier Comparison">Courier Comparison</option>
                <option value="COD & Finance">COD & Finance</option>
                <option value="Shipping Optimization">Shipping Optimization</option>
                <option value="Growth & Operations">Growth & Operations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
            Meta Description / Article Excerpt (140–160 chars for SEO)
          </label>
          <textarea
            rows={3}
            placeholder="A compelling summary for search results and social share cards..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Featured Image URL & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
              Cover Image URL
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
              Keywords & Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="NDR, RTO, WhatsApp Automation, Shadowfax"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Author Details & Read Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
              Author Name
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
              Author Role
            </label>
            <input
              type="text"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-1.5">
              Estimated Read Time
            </label>
            <input
              type="text"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase text-slate-700">
              Key Takeaways (Highlighted Summary Box)
            </label>
            <button
              type="button"
              onClick={addTakeaway}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              <Plus size={12} />
              <span>Add Bullet</span>
            </button>
          </div>

          {keyTakeaways.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
              <input
                type="text"
                placeholder="Important highlight..."
                value={item}
                onChange={(e) => updateTakeaway(idx, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeTakeaway(idx)}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Content Paragraphs */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase text-slate-700">
              Article Content Paragraphs
            </label>
            <button
              type="button"
              onClick={addParagraph}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              <Plus size={12} />
              <span>Add Paragraph</span>
            </button>
          </div>

          {contentParagraphs.map((para, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Paragraph {idx + 1}</span>
                {contentParagraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParagraph(idx)}
                    className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={para}
                onChange={(e) => updateParagraph(idx, e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Bottom Save */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link
            href="/admin/blogs"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {saving ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Save size={16} />}
            <span>{isNew ? "Publish Article" : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
