import PocketBase from "pocketbase";

// Validate environment variables
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;

if (!pocketbaseUrl) {
  throw new Error(
    "VITE_POCKETBASE_URL environment variable is required. Please set it to your PocketBase instance URL.",
  );
}

// Create PocketBase client
export const pb = new PocketBase(pocketbaseUrl);

// Configure PocketBase settings
pb.autoCancellation(false);

export default pb;
