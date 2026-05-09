import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Admin画面では閲覧が中心となるため、基本的には共通設定で対応
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
