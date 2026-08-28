"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
} from "lucide-react";
import { BLOG_POSTS, type BlogPost } from "@/lib/blog-data";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "ALL",
    "RTO Management",
    "Courier Comparison",
    "COD & Finance",
    "Shipping Optimization",
    "Growth & Operations",
  ];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === "ALL" || post.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
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

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              href="/#rates"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
            >
              <span>Pricing (From ₹78)</span>
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

          {/* Actions */}
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

      {/* 2. HERO HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-[#f8fafc] pt-12 pb-14 border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-xs">
              <Sparkles size={14} className="text-indigo-600" />
              <span>Logistics Intelligence &amp; D2C Guides</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Insights for Modern Shipping Operations
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Actionable guides, data-driven courier comparisons, and tactical advice on reducing RTO, optimizing freight, and scaling e-commerce delivery across India.
            </p>

            {/* Search Input Bar */}
            <div className="w-full max-w-lg pt-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles on RTO, courier rates, NDR, COD..."
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY TABS & ARTICLE GRID */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {cat === "ALL" ? "All Articles" : cat}
            </button>
          ))}
        </div>

        {/* FEATURED POST (Shown when ALL and no search query) */}
        {selectedCategory === "ALL" && !searchQuery && featuredPost && (
          <div className="my-8">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group block overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="grid lg:grid-cols-12 gap-0">
                <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${featuredPost.categoryColor}`}>
                        Featured • {featuredPost.category}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={12} /> {featuredPost.readTime}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        className="size-9 rounded-full object-cover ring-2 ring-indigo-50"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{featuredPost.author.name}</p>
                        <p className="text-[10px] text-slate-400">{featuredPost.publishedAt}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight size={14} />
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[260px] overflow-hidden bg-slate-100">
                  <img
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ARTICLES GRID */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              {searchQuery
                ? `Search results for "${searchQuery}" (${filteredPosts.length})`
                : selectedCategory === "ALL"
                ? "Recent Logistics Guides"
                : `${selectedCategory} Articles (${filteredPosts.length})`}
            </h3>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <BookOpen className="mx-auto size-12 text-slate-300 stroke-1" />
              <h4 className="text-base font-bold text-slate-800">No articles found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for other keywords like &quot;RTO&quot;, &quot;courier&quot;, &quot;COD&quot;, or &quot;freight&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-3 left-3 rounded-lg px-2.5 py-0.5 text-[10px] font-bold border backdrop-blur-md shadow-xs ${post.categoryColor}`}>
                        {post.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {post.publishedAt}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {post.readTime}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Author & Read More */}
                  <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="size-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-slate-800">{post.author.name}</span>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Read <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 4. NEWSLETTER / CTA BANNER */}
        <div className="my-16 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-200 border border-indigo-400/20">
              <TrendingUp size={14} /> Ready to streamline your logistics?
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Start shipping at industry-best courier rates today.
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Integrate Delhivery, Shadowfax, and Xpressbees under one single account. Zero setup fee, instant automated wallet activation, and unified NDR management.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-900 hover:bg-slate-100 shadow-md transition-all hover:scale-[1.02]"
              >
                Create Seller Account <ArrowRight size={14} />
              </Link>
              <Link
                href="/#rates"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-white hover:bg-white/20 transition-all"
              >
                Calculate Shipping Rates
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 5. FOOTER */}
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
              Pricing (From ₹78)
            </Link>
            <Link href="/blog" className="hover:text-slate-900 transition-colors">
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
