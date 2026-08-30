import fs from "fs";
import path from "path";
import { BLOG_POSTS, type BlogPost } from "./blog-data";

const BLOGS_FILE_PATH = path.join(process.cwd(), "data", "blog-posts.json");

export function getAllBlogPosts(): BlogPost[] {
  try {
    if (fs.existsSync(BLOGS_FILE_PATH)) {
      const data = fs.readFileSync(BLOGS_FILE_PATH, "utf-8");
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn("[BlogStore] Failed to read blog posts from disk:", err);
  }
  return BLOG_POSTS;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const posts = getAllBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export function saveBlogPost(post: BlogPost): BlogPost {
  try {
    const dir = path.dirname(BLOGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = getAllBlogPosts();
    const existingIndex = current.findIndex((p) => p.slug === post.slug);
    if (existingIndex >= 0) {
      current[existingIndex] = post;
    } else {
      current.unshift(post);
    }
    fs.writeFileSync(BLOGS_FILE_PATH, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.warn("[BlogStore] Failed to save blog post to disk:", err);
  }
  return post;
}

export function deleteBlogPost(slug: string): boolean {
  try {
    const dir = path.dirname(BLOGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = getAllBlogPosts();
    const filtered = current.filter((p) => p.slug !== slug);
    fs.writeFileSync(BLOGS_FILE_PATH, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("[BlogStore] Failed to delete blog post from disk:", err);
    return false;
  }
}
