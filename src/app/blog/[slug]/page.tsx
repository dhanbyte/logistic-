import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Share2,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-data";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Truck size={20} />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                Shipwave
              </span>
              <span className="text-[9px] font-semibold text-indigo-600 tracking-wider uppercase">
                Logistics OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              href="/#rates"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
            >
              <span>Pricing (From ₹72)</span>
              <span className="rounded bg-emerald-600 text-[9px] font-black text-white px-1.5 py-0.2">
                ₹0 RTO
              </span>
            </Link>
            <Link href="/#platform" className="hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/#rates" className="hover:text-slate-900 transition-colors font-medium">
              Pricing
            </Link>
            <Link href="/#tracking" className="hover:text-slate-900 transition-colors">
              Track shipment
            </Link>
            <Link href="/blog" className="text-indigo-600 font-bold transition-colors">
              Blog
            </Link>
            <Link href="/#rates" className="hover:text-slate-900 transition-colors">
              Rate Calculator
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all hover:scale-[1.02]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN POST BODY */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to all articles
        </Link>

        {/* Post Meta */}
        <article className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-lg px-3 py-1 text-xs font-bold border ${post.categoryColor}`}>
                {post.category}
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar size={12} /> {post.publishedAt}
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock size={12} /> {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              {post.excerpt}
            </p>

            {/* Author Byline */}
            <div className="flex items-center justify-between border-y border-slate-200/80 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="size-11 rounded-full object-cover ring-2 ring-indigo-100"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{post.author.name}</h4>
                  <p className="text-xs text-slate-500">{post.author.role} • Shipwave Research</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Banner Image */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-md">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full max-h-[460px] object-cover"
            />
          </div>

          {/* Key Takeaways Callout Card */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm uppercase tracking-wider">
                <Sparkles size={16} className="text-indigo-600" />
                <span>Key Executive Takeaways</span>
              </div>
              <ul className="space-y-2.5">
                {post.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-indigo-950/80 leading-relaxed font-medium">
                    <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Paragraphs */}
          <div className="prose prose-slate max-w-none space-y-5 text-sm sm:text-base text-slate-700 leading-relaxed pt-4">
            {post.content.map((p, idx) => (
              <p key={idx} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <Tag size={14} className="text-slate-400" />
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200/60"
              >
                #{t}
              </span>
            ))}
          </div>
        </article>

        {/* CTA Card */}
        <div className="my-12 rounded-3xl bg-slate-900 p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black">Ship with unified courier automation</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Deliver across 10,000+ pincodes with Delhivery, Shadowfax, and Xpressbees.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-700 shadow-md transition-all hover:scale-105 whitespace-nowrap"
          >
            Get started for free &rarr;
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Related Articles</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition-all"
                >
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border mb-2 ${r.categoryColor}`}>
                    {r.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {r.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                    <Clock size={10} /> {r.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-indigo-600 text-white">
              <Truck size={14} />
            </span>
            <span className="text-xs font-black tracking-tight text-slate-900">
              Shipwave Logistics OS
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} Shipwave India. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <Link href="/#platform" className="hover:text-slate-900 transition-colors">
              Platform
            </Link>
            <Link href="/#rates" className="hover:text-slate-900 text-indigo-600 font-bold transition-colors">
              Pricing (From ₹72)
            </Link>
            <Link href="/blog" className="text-indigo-600 font-bold transition-colors">
              Blog
            </Link>
            <Link href="/#tracking" className="hover:text-slate-900 transition-colors">
              Track shipment
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
