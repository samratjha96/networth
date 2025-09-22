#!/usr/bin/env node

/**
 * Consolidated Database Explorer Script
 *
 * This script provides comprehensive database exploration and maintenance tools
 * for debugging user data issues, analyzing account values, and managing net worth history.
 *
 * Usage:
 * node scripts/database.js <command> [options]
 *
 * Commands:
 * - users                    : List all users
 * - explore <userId>         : Comprehensive data exploration for a user
 * - accounts <userId>        : Analyze account values and mappings
 * - networth <userId>        : Analyze net worth history
 * - cleanup <userId>         : Clean up problematic data entries
 * - migrate <userId>         : Run migration for a specific user
 *
 * Examples:
 * node scripts/database.js users
 * node scripts/database.js explore xdthzlgevuy38dg
 * node scripts/database.js accounts xdthzlgevuy38dg
 * node scripts/database.js networth xdthzlgevuy38dg
 * node scripts/database.js cleanup xdthzlgevuy38dg
 */

import PocketBase from "pocketbase";
import { config } from "dotenv";

// Load environment variables
config();

const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

class DatabaseExplorer {
  constructor() {
    this.pb = new PocketBase(POCKETBASE_URL);
  }

  async authenticate() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set",
      );
    }

    try {
      await this.pb
        .collection("_superusers")
        .authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log("✅ Successfully authenticated as superuser");
    } catch (superuserError) {
      try {
        await this.pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("✅ Successfully authenticated as admin");
      } catch (adminError) {
        throw adminError;
      }
    }
  }

  // ==================== USER MANAGEMENT ====================

  async listUsers() {
    console.log("\n👥 Listing all users...");
    console.log("=".repeat(80));

    try {
      const users = await this.pb.collection("users").getFullList();

      if (users.length === 0) {
        console.log("No users found in the database.");
        return;
      }

      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || "No email"}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name || "No name"}`);
        console.log(`   Created: ${new Date(user.created).toLocaleString()}`);
        console.log("   " + "-".repeat(60));
      });
    } catch (error) {
      console.error("❌ Error fetching users:", error.message);
    }
  }

  async validateUser(userId) {
    try {
      const user = await this.pb.collection("users").getOne(userId);
      console.log(`✅ User found: ${user.email || user.id}`);
      return user;
    } catch (error) {
      throw new Error(`User ${userId} not found: ${error.message}`);
    }
  }

  // ==================== COMPREHENSIVE EXPLORATION ====================

  async exploreUser(userId) {
    console.log(`\n🔍 Comprehensive Data Exploration for User: ${userId}`);
    console.log("=".repeat(80));

    await this.validateUser(userId);

    // Run all analysis functions
    await this.analyzeAccounts(userId);
    await this.analyzeNetWorthHistory(userId);
    await this.calculateExpectedNetWorth(userId);
    await this.identifyDataIssues(userId);
  }

  // ==================== ACCOUNT ANALYSIS ====================

  async analyzeAccounts(userId) {
    console.log("\n📊 Account Analysis");
    console.log("-".repeat(50));

    try {
      // Get all accounts
      const accounts = await this.pb.collection("argos_accounts").getFullList({
        filter: `user_id="${userId}"`,
      });

      console.log(`Found ${accounts.length} accounts:`);

      if (accounts.length === 0) {
        console.log("❌ No accounts found for this user");
        return;
      }

      let totalNetWorth = 0;
      const accountDetails = [];

      for (const account of accounts) {
        try {
          // Get latest hourly value
          const latestValue = await this.pb
            .collection("argos_hourly_account_values")
            .getFirstListItem(`account_id="${account.id}"`, {
              sort: "-hour_start",
            });

          // Get count of hourly values
          const valueCount = await this.pb
            .collection("argos_hourly_account_values")
            .getFullList({
              filter: `account_id="${account.id}"`,
            });

          const value = account.is_debt
            ? -Math.abs(latestValue.value)
            : latestValue.value;
          totalNetWorth += value;

          accountDetails.push({
            name: account.name,
            type: account.type,
            value: value,
            isDebt: account.is_debt,
            valueCount: valueCount.length,
            lastUpdate: new Date(latestValue.hour_start).toLocaleString(),
            id: account.id,
          });
        } catch (error) {
          accountDetails.push({
            name: account.name,
            type: account.type,
            value: 0,
            isDebt: account.is_debt,
            valueCount: 0,
            lastUpdate: "No data",
            id: account.id,
            hasError: true,
          });
        }
      }

      // Display account details
      accountDetails.forEach((account, index) => {
        const status = account.hasError ? "❌" : "✅";
        const debtLabel = account.isDebt ? " (debt)" : "";
        console.log(
          `  ${index + 1}. ${status} ${account.name} (${account.type})${debtLabel}`,
        );
        console.log(`     Value: $${account.value.toLocaleString()}`);
        console.log(`     Data Points: ${account.valueCount}`);
        console.log(`     Last Update: ${account.lastUpdate}`);
        console.log(`     ID: ${account.id}`);
      });

      console.log(`\n💰 Total Net Worth: $${totalNetWorth.toLocaleString()}`);
      return { accounts: accountDetails, totalNetWorth };
    } catch (error) {
      console.error("❌ Error analyzing accounts:", error.message);
      return { accounts: [], totalNetWorth: 0 };
    }
  }

  // ==================== NET WORTH ANALYSIS ====================

  async analyzeNetWorthHistory(userId) {
    console.log("\n📈 Net Worth History Analysis");
    console.log("-".repeat(50));

    try {
      const allHistory = await this.pb
        .collection("argos_networth_history")
        .getFullList({
          filter: `user_id="${userId}"`,
          sort: "-date",
        });

      console.log(`Found ${allHistory.length} net worth history entries`);

      if (allHistory.length === 0) {
        console.log("❌ No net worth history found");
        return;
      }

      // Analysis
      const zeroEntries = allHistory.filter(
        (entry) => Math.abs(entry.value) < 1,
      );
      const negativeEntries = allHistory.filter((entry) => entry.value < 0);
      const recentEntries = allHistory.filter((entry) => {
        const date = new Date(entry.date);
        return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
      });

      console.log(`📊 Summary:`);
      console.log(`   Total entries: ${allHistory.length}`);
      console.log(`   Near-zero entries (< $1): ${zeroEntries.length}`);
      console.log(`   Negative entries: ${negativeEntries.length}`);
      console.log(`   Recent entries (7 days): ${recentEntries.length}`);

      // Show latest entries
      console.log(`\n📅 Latest 10 entries:`);
      allHistory.slice(0, 10).forEach((entry, index) => {
        const date = new Date(entry.date);
        const isRecent = Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
        const marker = isRecent ? " ← RECENT" : "";
        const flag = Math.abs(entry.value) < 1 ? " ⚠️ NEAR-ZERO" : "";
        console.log(
          `   ${index + 1}. ${date.toLocaleString()} - $${entry.value.toLocaleString()}${marker}${flag}`,
        );
      });

      // Show problematic entries
      if (zeroEntries.length > 0) {
        console.log(`\n⚠️  Near-zero entries:`);
        zeroEntries.slice(0, 5).forEach((entry) => {
          console.log(
            `   ${new Date(entry.date).toLocaleString()} - $${entry.value}`,
          );
        });
        if (zeroEntries.length > 5) {
          console.log(`   ... and ${zeroEntries.length - 5} more`);
        }
      }

      return {
        total: allHistory.length,
        zeroCount: zeroEntries.length,
        negativeCount: negativeEntries.length,
        recentCount: recentEntries.length,
        latest: allHistory[0],
      };
    } catch (error) {
      console.error("❌ Error analyzing net worth history:", error.message);
      return null;
    }
  }

  async calculateExpectedNetWorth(userId) {
    console.log("\n🧮 Expected Net Worth Calculation");
    console.log("-".repeat(50));

    const accountAnalysis = await this.analyzeAccounts(userId);
    const networthAnalysis = await this.analyzeNetWorthHistory(userId);

    if (accountAnalysis && networthAnalysis) {
      const expectedNetWorth = accountAnalysis.totalNetWorth;
      const latestHistoryValue = networthAnalysis.latest?.value || 0;
      const difference = expectedNetWorth - latestHistoryValue;

      console.log(
        `💰 Expected (from accounts): $${expectedNetWorth.toLocaleString()}`,
      );
      console.log(
        `📊 Latest history entry: $${latestHistoryValue.toLocaleString()}`,
      );

      if (Math.abs(difference) > 1) {
        console.log(`⚠️  Difference: $${difference.toLocaleString()}`);
        console.log(
          "   Net worth history may be out of sync with account values",
        );
      } else {
        console.log("✅ Net worth history matches expected value");
      }

      return { expectedNetWorth, latestHistoryValue, difference };
    }

    return null;
  }

  // ==================== DATA ISSUE IDENTIFICATION ====================

  async identifyDataIssues(userId) {
    console.log("\n🔍 Data Issues Identification");
    console.log("-".repeat(50));

    const issues = [];

    try {
      // Check for accounts without values
      const accounts = await this.pb.collection("argos_accounts").getFullList({
        filter: `user_id="${userId}"`,
      });

      for (const account of accounts) {
        try {
          await this.pb
            .collection("argos_hourly_account_values")
            .getFirstListItem(`account_id="${account.id}"`);
        } catch (error) {
          issues.push(`Account "${account.name}" has no hourly values`);
        }
      }

      // Check for near-zero net worth entries
      const zeroEntries = await this.pb
        .collection("argos_networth_history")
        .getFullList({
          filter: `user_id="${userId}" && value<1 && value>-1`,
        });

      if (zeroEntries.length > 0) {
        issues.push(`${zeroEntries.length} near-zero net worth entries found`);
      }

      // Check for duplicate entries on same date
      const allHistory = await this.pb
        .collection("argos_networth_history")
        .getFullList({
          filter: `user_id="${userId}"`,
          sort: "date",
        });

      const dateGroups = {};
      allHistory.forEach((entry) => {
        const dateKey = new Date(entry.date).toDateString();
        if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
        dateGroups[dateKey].push(entry);
      });

      const duplicateDates = Object.entries(dateGroups).filter(
        ([_, entries]) => entries.length > 1,
      );
      if (duplicateDates.length > 0) {
        issues.push(
          `${duplicateDates.length} dates with multiple net worth entries`,
        );
      }

      // Display issues
      if (issues.length === 0) {
        console.log("✅ No data issues detected");
      } else {
        console.log(`⚠️  Found ${issues.length} potential issues:`);
        issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
      }

      return issues;
    } catch (error) {
      console.error("❌ Error identifying data issues:", error.message);
      return [];
    }
  }

  // ==================== DATA CLEANUP ====================

  async cleanupUserData(userId) {
    console.log(`\n🧹 Data Cleanup for User: ${userId}`);
    console.log("=".repeat(80));

    await this.validateUser(userId);

    // Clean up near-zero net worth entries
    await this.cleanupNearZeroEntries(userId);

    // Create correct net worth entry
    await this.createCorrectNetWorthEntry(userId);

    console.log("\n✅ Cleanup completed");
  }

  async cleanupNearZeroEntries(userId) {
    console.log("\n🗑️  Cleaning up near-zero net worth entries...");

    try {
      const allEntries = await this.pb
        .collection("argos_networth_history")
        .getFullList({
          filter: `user_id="${userId}"`,
        });

      const nearZeroEntries = allEntries.filter(
        (entry) => Math.abs(entry.value) < 1,
      );

      console.log(
        `Found ${nearZeroEntries.length} entries with near-zero values (< $1)`,
      );

      if (nearZeroEntries.length === 0) {
        console.log("✅ No near-zero entries to remove");
        return;
      }

      let deletedCount = 0;
      for (const entry of nearZeroEntries) {
        try {
          await this.pb.collection("argos_networth_history").delete(entry.id);
          deletedCount++;
        } catch (error) {
          console.error(
            `❌ Failed to delete entry ${entry.id}: ${error.message}`,
          );
        }
      }

      console.log(
        `✅ Deleted ${deletedCount} out of ${nearZeroEntries.length} near-zero entries`,
      );
    } catch (error) {
      console.error("❌ Error cleaning up near-zero entries:", error.message);
    }
  }

  async createCorrectNetWorthEntry(userId) {
    console.log("\n📝 Creating correct net worth entry...");

    try {
      const accounts = await this.pb.collection("argos_accounts").getFullList({
        filter: `user_id="${userId}"`,
      });

      let totalNetWorth = 0;

      for (const account of accounts) {
        try {
          const latestValue = await this.pb
            .collection("argos_hourly_account_values")
            .getFirstListItem(`account_id="${account.id}"`, {
              sort: "-hour_start",
            });

          const value = account.is_debt
            ? -Math.abs(latestValue.value)
            : latestValue.value;
          totalNetWorth += value;
        } catch (error) {
          // Account has no values, use 0
        }
      }

      console.log(
        `💰 Calculated net worth: $${totalNetWorth.toLocaleString()}`,
      );

      const now = new Date();
      await this.pb.collection("argos_networth_history").create({
        user_id: userId,
        value: totalNetWorth,
        date: now.toISOString(),
      });

      console.log(
        `✅ Created new net worth entry: $${totalNetWorth.toLocaleString()}`,
      );
    } catch (error) {
      console.error("❌ Error creating net worth entry:", error.message);
    }
  }

  // ==================== MAIN EXECUTION ====================

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    const userId = args[1];

    if (!command) {
      this.showHelp();
      return;
    }

    try {
      console.log("🚀 Database Explorer");
      console.log(`📍 PocketBase URL: ${POCKETBASE_URL}`);

      await this.authenticate();

      switch (command.toLowerCase()) {
        case "users":
          await this.listUsers();
          break;

        case "explore":
          if (!userId) {
            console.error("❌ User ID required for explore command");
            process.exit(1);
          }
          await this.exploreUser(userId);
          break;

        case "accounts":
          if (!userId) {
            console.error("❌ User ID required for accounts command");
            process.exit(1);
          }
          await this.analyzeAccounts(userId);
          break;

        case "networth":
          if (!userId) {
            console.error("❌ User ID required for networth command");
            process.exit(1);
          }
          await this.analyzeNetWorthHistory(userId);
          break;

        case "cleanup":
          if (!userId) {
            console.error("❌ User ID required for cleanup command");
            process.exit(1);
          }
          await this.cleanupUserData(userId);
          break;

        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }

      console.log("\n🎉 Operation completed successfully!");
    } catch (error) {
      console.error("\n💥 Operation failed:", error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
📖 Database Explorer - Help

Usage: node scripts/database.js <command> [options]

Commands:
  users                    List all users in the database
  explore <userId>         Comprehensive data exploration for a user
  accounts <userId>        Analyze account values and mappings
  networth <userId>        Analyze net worth history
  cleanup <userId>         Clean up problematic data entries

Examples:
  node scripts/database.js users
  node scripts/database.js explore xdthzlgevuy38dg
  node scripts/database.js accounts xdthzlgevuy38dg
  node scripts/database.js networth xdthzlgevuy38dg
  node scripts/database.js cleanup xdthzlgevuy38dg

Environment Variables:
  POCKETBASE_URL           PocketBase instance URL
  POCKETBASE_ADMIN_EMAIL   Admin email for authentication
  POCKETBASE_ADMIN_PASSWORD Admin password for authentication
        `);
  }
}

// Run the database explorer
const explorer = new DatabaseExplorer();
explorer.run();
