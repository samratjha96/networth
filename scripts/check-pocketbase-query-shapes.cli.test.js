// ABOUTME: Lightweight tests for the query-shape script CLI parsing
// ABOUTME: Runs without a test framework using Node assertions

import assert from "node:assert/strict";

import {
  parseCliArgs,
  resolveAuthMode,
} from "./check-pocketbase-query-shapes.js";

function testParseCliArgs() {
  const result = parseCliArgs([
    "--pb-url",
    "https://example.com",
    "--user-id",
    "abc123",
    "--admin-email",
    "admin@example.com",
    "--admin-password",
    "secret",
  ]);

  assert.equal(result.pbUrl, "https://example.com");
  assert.equal(result.userId, "abc123");
  assert.equal(result.adminEmail, "admin@example.com");
  assert.equal(result.adminPassword, "secret");
}

function testResolveAuthModePrefersAdmin() {
  const mode = resolveAuthMode({
    adminEmail: "admin@example.com",
    adminPassword: "secret",
    userEmail: "user@example.com",
    userPassword: "secret",
  });

  assert.equal(mode, "admin");
}

function testResolveAuthModeUser() {
  const mode = resolveAuthMode({
    userEmail: "user@example.com",
    userPassword: "secret",
  });

  assert.equal(mode, "user");
}

testParseCliArgs();
testResolveAuthModePrefersAdmin();
testResolveAuthModeUser();

console.log("CLI tests passed");
