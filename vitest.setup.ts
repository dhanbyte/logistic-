import "@testing-library/jest-dom/vitest";
import { existsSync } from "node:fs";
import path from "node:path";

if (typeof process.loadEnvFile === "function") {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (existsSync(envLocal)) {
    process.loadEnvFile(envLocal);
  }
}
