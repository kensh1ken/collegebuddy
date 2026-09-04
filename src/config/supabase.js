const { createClient } = require("@supabase/supabase-js");
const { env } = require("./env");

let client;

function getSupabase() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) {
    const error = new Error("File storage is not configured");
    error.statusCode = 503;
    error.code = "STORAGE_NOT_CONFIGURED";
    throw error;
  }

  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

module.exports = { getSupabase };
