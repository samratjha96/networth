/**
 * PocketBase Collection Schema Definitions
 * Maps Supabase PostgreSQL tables to PocketBase collections
 */

export interface PocketBaseAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_debt: boolean;
  currency: string;
  created: string;
  updated: string;
}

export interface PocketBaseAccountValue {
  id: string;
  account_id: string;
  user_id: string;
  hour_start: string;
  value: number;
  created: string;
  updated: string;
}

export interface PocketBaseNetworthHistory {
  id: string;
  user_id: string;
  date: string;
  value: number;
  created: string;
}

/**
 * Collection Schema Configuration for PocketBase Admin UI
 * Copy these configurations to set up collections in PocketBase Admin Panel
 */

export const accountsCollectionSchema = {
  name: "accounts",
  type: "base",
  system: false,
  schema: [
    {
      name: "user_id",
      type: "relation",
      required: true,
      options: {
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
        displayFields: ["email"],
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
  indexes: ["CREATE INDEX idx_accounts_user_id ON accounts(user_id)"],
};

export const accountValuesCollectionSchema = {
  name: "account_values",
  type: "base",
  system: false,
  schema: [
    {
      name: "account_id",
      type: "relation",
      required: true,
      options: {
        collectionId: "accounts",
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
        displayFields: ["name"],
      },
    },
    {
      name: "user_id",
      type: "relation",
      required: true,
      options: {
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
        displayFields: ["email"],
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
      options: {},
    },
  ],
  indexes: [
    "CREATE INDEX idx_account_values_account_id ON account_values(account_id)",
    "CREATE INDEX idx_account_values_user_id ON account_values(user_id)",
    "CREATE INDEX idx_account_values_hour_start ON account_values(hour_start)",
    "CREATE UNIQUE INDEX idx_account_values_unique ON account_values(account_id, hour_start)",
  ],
};

export const networthHistoryCollectionSchema = {
  name: "networth_history",
  type: "base",
  system: false,
  schema: [
    {
      name: "user_id",
      type: "relation",
      required: true,
      options: {
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
        displayFields: ["email"],
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
      options: {},
    },
  ],
  indexes: [
    "CREATE INDEX idx_networth_history_user_id ON networth_history(user_id)",
    "CREATE INDEX idx_networth_history_date ON networth_history(date)",
  ],
};
