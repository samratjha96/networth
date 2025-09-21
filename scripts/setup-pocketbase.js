#!/usr/bin/env node

/**
 * PocketBase Collection Setup Script for Argos Net Worth Application
 *
 * This script creates the required collections in PocketBase with the 'argos_' prefix.
 * Run this script after setting up a fresh PocketBase instance.
 *
 * Usage: node setup-pocketbase.js [pocketbase-url] [admin-email] [admin-password]
 *
 * Collections created:
 * - argos_accounts: User financial accounts
 * - argos_hourly_account_values: Historical account values (hourly snapshots)
 * - argos_networth_history: Historical net worth data
 *
 * Note: Uses PocketBase's built-in 'users' collection for user management
 */

import PocketBase from "pocketbase";

// Configuration
const DEFAULT_POCKETBASE_URL = "http://localhost:8090";
const COLLECTION_PREFIX = "argos_";

// Parse command line arguments
const args = process.argv.slice(2);
const pocketbaseUrl = args[0] || DEFAULT_POCKETBASE_URL;
const adminEmail = args[1] || process.env.PB_ADMIN_EMAIL;
const adminPassword = args[2] || process.env.PB_ADMIN_PASSWORD;

// Initialize PocketBase client
const pb = new PocketBase(pocketbaseUrl);

/**
 * Utility functions
 */
function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

/**
 * Authenticate as admin/superuser
 */
async function authenticateAdmin() {
  if (!adminEmail || !adminPassword) {
    logError(
      "Admin credentials not provided. Please set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables or pass them as arguments.",
    );
    logInfo(
      "Usage: node setup-pocketbase.js [pocketbase-url] [admin-email] [admin-password]",
    );
    process.exit(1);
  }

  try {
    logInfo(`Attempting superuser authentication: ${adminEmail}`);
    await pb
      .collection("_superusers")
      .authWithPassword(adminEmail, adminPassword);
    logSuccess("Successfully authenticated as superuser");
  } catch (superuserError) {
    logInfo("Superuser auth failed, trying admin authentication...");

    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      logSuccess("Successfully authenticated as admin");
    } catch (adminError) {
      logError("Both superuser and admin authentication failed");
      logError(`Superuser error: ${superuserError.message}`);
      logError(`Admin error: ${adminError.message}`);
      throw adminError;
    }
  }
}

/**
 * Delete existing collections if they exist
 */
async function deleteExistingCollections() {
  const collectionsToDelete = [
    `${COLLECTION_PREFIX}networth_history`,
    `${COLLECTION_PREFIX}hourly_account_values`,
    `${COLLECTION_PREFIX}accounts`,
  ];

  logInfo("Checking for existing collections to delete...");

  for (const collectionName of collectionsToDelete) {
    try {
      await pb.collections.delete(collectionName);
      logSuccess(`✓ Deleted collection: ${collectionName}`);
    } catch (error) {
      if (error.status === 404) {
        logInfo(`Collection ${collectionName} does not exist, skipping...`);
      } else {
        logWarning(
          `Failed to delete collection ${collectionName}: ${error.message}`,
        );
      }
    }
  }
}

/**
 * Create Accounts Collection (matches public.accounts table - financial accounts)
 */
async function createAccountsCollection() {
  try {
    const accountsSchema = {
      name: `${COLLECTION_PREFIX}accounts`,
      type: "base",
      fields: [
        {
          name: "user_id",
          type: "text",
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: "name",
          type: "text",
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: "type",
          type: "text",
          required: true,
          options: {
            min: 1,
            max: 100,
          },
        },
        {
          name: "is_debt",
          type: "bool",
          required: false,
          options: {},
        },
        {
          name: "currency",
          type: "text",
          required: true,
          options: {
            min: 3,
            max: 3,
            pattern: "^[A-Z]{3}$",
          },
        },
      ],
    };

    await pb.collections.create(accountsSchema);
    logSuccess("Accounts collection created");
  } catch (error) {
    if (
      error.status === 400 &&
      (error.data?.message?.includes("already exists") ||
        error.data?.data?.name?.code === "validation_collection_name_exists")
    ) {
      logInfo("Accounts collection already exists");
    } else {
      logError(`Failed to create Accounts collection: ${error.message}`);
      if (error.data?.data) {
        console.error(
          "Validation errors:",
          JSON.stringify(error.data.data, null, 2),
        );
      }
      throw error;
    }
  }
}

/**
 * Create Hourly Account Values Collection (matches public.hourly_account_values table)
 */
async function createHourlyAccountValuesCollection() {
  try {
    const hourlyValuesSchema = {
      name: `${COLLECTION_PREFIX}hourly_account_values`,
      type: "base",
      fields: [
        {
          name: "account_id",
          type: "text",
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: "user_id",
          type: "text",
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: "hour_start",
          type: "date",
          required: true,
          options: {},
        },
        {
          name: "value",
          type: "number",
          required: true,
          options: {
            min: null,
            max: null,
            noDecimal: false,
          },
        },
      ],
    };

    await pb.collections.create(hourlyValuesSchema);
    logSuccess("Hourly Account Values collection created");
  } catch (error) {
    if (
      error.status === 400 &&
      (error.data?.message?.includes("already exists") ||
        error.data?.data?.name?.code === "validation_collection_name_exists")
    ) {
      logInfo("Hourly Account Values collection already exists");
    } else {
      logError(
        `Failed to create Hourly Account Values collection: ${error.message}`,
      );
      if (error.data?.data) {
        console.error(
          "Validation errors:",
          JSON.stringify(error.data.data, null, 2),
        );
      }
      throw error;
    }
  }
}

/**
 * Create Net Worth History Collection (matches public.networth_history table)
 */
async function createNetWorthHistoryCollection() {
  try {
    const networthSchema = {
      name: `${COLLECTION_PREFIX}networth_history`,
      type: "base",
      fields: [
        {
          name: "user_id",
          type: "text",
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: "date",
          type: "date",
          required: true,
          options: {},
        },
        {
          name: "value",
          type: "number",
          required: true,
          options: {
            min: null,
            max: null,
            noDecimal: false,
          },
        },
      ],
    };

    await pb.collections.create(networthSchema);
    logSuccess("Net Worth History collection created");
  } catch (error) {
    if (
      error.status === 400 &&
      (error.data?.message?.includes("already exists") ||
        error.data?.data?.name?.code === "validation_collection_name_exists")
    ) {
      logInfo("Net Worth History collection already exists");
    } else {
      logError(
        `Failed to create Net Worth History collection: ${error.message}`,
      );
      if (error.data?.data) {
        console.error(
          "Validation errors:",
          JSON.stringify(error.data.data, null, 2),
        );
      }
      throw error;
    }
  }
}

/**
 * Update access rules for all collections
 */
async function updateAccessRules() {
  logInfo("Updating access rules for collections...");

  const collectionRules = {
    [`${COLLECTION_PREFIX}accounts`]: {
      listRule: "user_id = @request.auth.id",
      viewRule: "user_id = @request.auth.id",
      createRule: "user_id = @request.auth.id",
      updateRule: "user_id = @request.auth.id",
      deleteRule: "user_id = @request.auth.id",
    },
    [`${COLLECTION_PREFIX}hourly_account_values`]: {
      listRule: "user_id = @request.auth.id",
      viewRule: "user_id = @request.auth.id",
      createRule: "user_id = @request.auth.id",
      updateRule: "user_id = @request.auth.id",
      deleteRule: "user_id = @request.auth.id",
    },
    [`${COLLECTION_PREFIX}networth_history`]: {
      listRule: "user_id = @request.auth.id",
      viewRule: "user_id = @request.auth.id",
      createRule: "user_id = @request.auth.id",
      updateRule: "user_id = @request.auth.id",
      deleteRule: "user_id = @request.auth.id",
    },
  };

  for (const [collectionName, rules] of Object.entries(collectionRules)) {
    try {
      logInfo(`Updating access rules for ${collectionName}...`);

      await pb.collections.update(collectionName, rules);

      logSuccess(`✓ Updated access rules for ${collectionName}`);
    } catch (error) {
      logWarning(
        `Failed to update access rules for ${collectionName}: ${error.message}`,
      );
      if (error.response?.data?.data) {
        console.error(
          "Access rule errors:",
          JSON.stringify(error.response.data.data, null, 2),
        );
      }
    }
  }
}

/**
 * Verify collections were created with proper fields
 */
async function verifyCollections() {
  logInfo("Verifying created collections...");

  const collectionsToCheck = [
    { name: `${COLLECTION_PREFIX}accounts`, expectedFields: 5 },
    { name: `${COLLECTION_PREFIX}hourly_account_values`, expectedFields: 4 },
    { name: `${COLLECTION_PREFIX}networth_history`, expectedFields: 3 },
  ];

  let allGood = true;

  for (const { name, expectedFields } of collectionsToCheck) {
    try {
      const collection = await pb.collections.getOne(name);
      const customFields = collection.fields
        ? collection.fields.filter((f) => !f.system).length
        : 0;

      if (customFields === expectedFields) {
        logSuccess(
          `✓ Collection '${name}' has correct number of fields (${customFields})`,
        );
      } else {
        logError(
          `✗ Collection '${name}' has ${customFields} fields, expected ${expectedFields}`,
        );
        allGood = false;
      }
    } catch (error) {
      logError(`Failed to verify collection '${name}': ${error.message}`);
      allGood = false;
    }
  }

  if (allGood) {
    logSuccess("All collections verified successfully!");
  } else {
    logWarning("Some collections have issues - check the output above");
  }
}

/**
 * Display setup summary
 */
function displaySummary() {
  logInfo("=".repeat(60));
  logInfo("PocketBase Collections Setup Summary");
  logInfo("=".repeat(60));
  logInfo(`PocketBase URL: ${pocketbaseUrl}`);
  logInfo(`Collection Prefix: ${COLLECTION_PREFIX}`);
  logInfo("Collections Created: 3");
  logInfo("");
  logInfo("Created Collections:");
  logInfo(
    `  - ${COLLECTION_PREFIX}accounts (5 fields) - User financial accounts`,
  );
  logInfo(
    `  - ${COLLECTION_PREFIX}hourly_account_values (4 fields) - Historical account values`,
  );
  logInfo(
    `  - ${COLLECTION_PREFIX}networth_history (3 fields) - Historical net worth data`,
  );
  logInfo("");
  logInfo("Built-in Collections Used:");
  logInfo("  - users - PocketBase built-in user management");
  logInfo("");
  logInfo("Next Steps:");
  logInfo("1. Update your application environment variables if needed");
  logInfo("2. Test the API endpoints with your application");
  logInfo("3. Create some test data to verify everything works");
  logInfo("=".repeat(60));
}

/**
 * Main setup function
 */
async function setupPocketBase() {
  try {
    logInfo(`Setting up PocketBase collections at: ${pocketbaseUrl}`);

    // Test connection
    logInfo("Testing PocketBase connection...");
    const health = await pb.health.check();
    logSuccess(`Connected to PocketBase (${health.message})`);

    // Authenticate as admin
    await authenticateAdmin();

    // Delete existing collections first (commented out to prevent accidental data loss)
    // await deleteExistingCollections();

    // Create collections in dependency order
    await createAccountsCollection();
    await createHourlyAccountValuesCollection();
    await createNetWorthHistoryCollection();

    // Update access rules
    await updateAccessRules();

    // Verify collections were created with fields
    await verifyCollections();

    // Display summary
    displaySummary();

    logSuccess("PocketBase setup completed successfully!");
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Run the setup
setupPocketBase();
