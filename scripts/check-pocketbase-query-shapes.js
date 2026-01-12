// ABOUTME: Validates PocketBase query patterns to avoid accidental full-table fetches
// ABOUTME: Optionally times old vs new query shapes against production

import fs from "node:fs/promises";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import PocketBase from "pocketbase";

export function parseCliArgs(argv) {
  const result = {
    pbUrl: undefined,
    adminEmail: undefined,
    adminPassword: undefined,
    userEmail: undefined,
    userPassword: undefined,
    userId: undefined,
    envFile: undefined,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const value = argv[i + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    switch (key) {
      case "pb-url":
        result.pbUrl = value;
        i++;
        break;
      case "admin-email":
        result.adminEmail = value;
        i++;
        break;
      case "admin-password":
        result.adminPassword = value;
        i++;
        break;
      case "user-email":
        result.userEmail = value;
        i++;
        break;
      case "user-password":
        result.userPassword = value;
        i++;
        break;
      case "user-id":
        result.userId = value;
        i++;
        break;
      case "env-file":
        result.envFile = value;
        i++;
        break;
      default:
        throw new Error(`Unknown flag: --${key}`);
    }
  }

  return result;
}

export function resolveAuthMode({
  adminEmail,
  adminPassword,
  userEmail,
  userPassword,
}) {
  if (adminEmail && adminPassword) return "admin";
  if (userEmail && userPassword) return "user";
  return "none";
}

const ROOT = new URL("..", import.meta.url);

async function readUtf8(relativePath) {
  const fileUrl = new URL(relativePath, ROOT);
  return fs.readFile(fileUrl, "utf8");
}

function findGetFullListWithPerPageOne({ content, filePath }) {
  const lines = content.split(/\r?\n/);
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("getFullList")) continue;

    // Scan a small window of subsequent lines to see if this call uses perPage: 1.
    // This avoids false positives from a regex spanning unrelated calls.
    const windowEnd = Math.min(lines.length, i + 30);
    for (let j = i; j < windowEnd; j++) {
      if (/perPage\s*:\s*1/.test(lines[j])) {
        matches.push({
          startLine: i + 1,
          perPageLine: j + 1,
          excerpt: lines.slice(i, Math.min(windowEnd, j + 3)).join("\n"),
        });
        break;
      }

      // Heuristic: stop scanning once the call likely ended.
      if (lines[j].includes("});")) {
        break;
      }
    }
  }

  if (matches.length === 0) return;

  console.error(`\nFound inefficient query patterns in ${filePath}:`);
  for (const match of matches) {
    console.error(
      `- getFullList() with perPage: 1 near lines ${match.startLine}..${match.perPageLine}`,
    );
    console.error(match.excerpt);
    console.error("-");
  }

  throw new Error("Inefficient query patterns detected");
}

async function validateSourceQueryShapes() {
  const pocketbaseApiPath = "src/api/pocketbase-api.ts";
  const content = await readUtf8(pocketbaseApiPath);

  // In PocketBase JS SDK, getFullList() ignores perPage and will fetch all pages.
  findGetFullListWithPerPageOne({ content, filePath: pocketbaseApiPath });
}

async function timeOperation(name, fn) {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { name, durationMs, result };
}

async function loadEnvFile(relativePath) {
  // Best-effort load; script also works with exported env vars.
  const fileUrl = new URL(relativePath, ROOT);

  let text;
  try {
    text = await fs.readFile(fileUrl, "utf8");
  } catch {
    return;
  }

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function authenticateAsAdmin(pb, { adminEmail, adminPassword }) {
  if (!adminEmail || !adminPassword) {
    throw new Error("Missing PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD");
  }

  // Prefer superuser auth (PocketBase >= 0.22).
  try {
    await pb
      .collection("_superusers")
      .authWithPassword(adminEmail, adminPassword);
    return;
  } catch (error) {
    // Fallback: some setups may still use the admins API.
    if (pb.admins?.authWithPassword) {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      return;
    }
    throw error;
  }
}

async function authenticateAsUser(pb, { userEmail, userPassword }) {
  const email = userEmail;
  const password = userPassword;

  if (!email || !password) {
    throw new Error("Missing PB_USER_EMAIL/PB_USER_PASSWORD");
  }

  await pb.collection("users").authWithPassword(email, password);
}

async function runProdTimingCheck() {
  const cli = parseCliArgs(process.argv.slice(2));

  if (cli.envFile) {
    await loadEnvFile(cli.envFile);
  } else {
    await loadEnvFile(".env");
    await loadEnvFile(".env.local");
  }

  const pbUrl =
    cli.pbUrl || process.env.PB_URL || process.env.VITE_POCKETBASE_URL;

  if (!pbUrl) {
    console.log("\nSkipping prod timing check (missing PB_URL).");
    return;
  }

  const config = {
    pbUrl,
    adminEmail: cli.adminEmail || process.env.PB_ADMIN_EMAIL,
    adminPassword: cli.adminPassword || process.env.PB_ADMIN_PASSWORD,
    userEmail: cli.userEmail || process.env.PB_USER_EMAIL,
    userPassword: cli.userPassword || process.env.PB_USER_PASSWORD,
    userId: cli.userId || process.env.PB_USER_ID || null,
  };

  const pb = new PocketBase(pbUrl);

  const authMode = resolveAuthMode(config);

  let userId = config.userId;

  if (authMode === "admin") {
    await authenticateAsAdmin(pb, config);
  } else if (authMode === "user") {
    await authenticateAsUser(pb, config);
    userId = pb.authStore.record?.id || userId;
  }

  if (!userId) {
    console.log(
      "\nSkipping prod timing check (missing --user-id or --user-email/--user-password).",
    );
    return;
  }

  const timeRangeStartDate = new Date();
  timeRangeStartDate.setDate(timeRangeStartDate.getDate() - 365);

  console.log("\nTiming PocketBase queries against:", pbUrl);

  const latestOld = await timeOperation(
    "latest-old:getFullList(perPage=1)",
    () =>
      pb.collection("argos_networth_history").getFullList({
        filter: `user_id=\"${userId}\"`,
        sort: "-date",
        perPage: 1,
      }),
  );

  const latestNew = await timeOperation("latest-new:getFirstListItem", () =>
    pb
      .collection("argos_networth_history")
      .getFirstListItem(`user_id=\"${userId}\"`, { sort: "-date" }),
  );

  const previousOld = await timeOperation(
    "previous-old:getFullList(perPage=1)",
    () =>
      pb.collection("argos_networth_history").getFullList({
        filter: `user_id=\"${userId}\" && date >= \"${timeRangeStartDate.toISOString()}\"`,
        sort: "date",
        perPage: 1,
      }),
  );

  const previousNew = await timeOperation("previous-new:getFirstListItem", () =>
    pb
      .collection("argos_networth_history")
      .getFirstListItem(
        `user_id=\"${userId}\" && date >= \"${timeRangeStartDate.toISOString()}\"`,
        { sort: "date" },
      ),
  );

  const oldLatestCount = Array.isArray(latestOld.result)
    ? latestOld.result.length
    : 0;
  const oldPreviousCount = Array.isArray(previousOld.result)
    ? previousOld.result.length
    : 0;

  console.log(
    `- ${latestOld.name}: ${latestOld.durationMs.toFixed(0)}ms, rows=${oldLatestCount}`,
  );
  console.log(`- ${latestNew.name}: ${latestNew.durationMs.toFixed(0)}ms`);
  console.log(
    `- ${previousOld.name}: ${previousOld.durationMs.toFixed(0)}ms, rows=${oldPreviousCount}`,
  );
  console.log(`- ${previousNew.name}: ${previousNew.durationMs.toFixed(0)}ms`);
}

function printUsage() {
  console.log(`
Usage:
  node scripts/check-pocketbase-query-shapes.js [options]

Options:
  --pb-url <url>                 PocketBase base URL
  --env-file <path>              Optional .env file to load

  Admin auth:
    --admin-email <email>
    --admin-password <password>
    --user-id <id>               Target user id (required for timing)

  User auth:
    --user-email <email>
    --user-password <password>

Notes:
  - Flags override env vars.
  - getFullList({ perPage: 1 }) is treated as an error.
`);
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help")) {
    printUsage();
    return;
  }

  try {
    await validateSourceQueryShapes();
    console.log("Source query shape checks passed");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }

  await runProdTimingCheck();
}

// Only execute when run directly, not when imported by tests.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
