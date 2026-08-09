const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xuhhzvmsbomqquuapqzq.supabase.co";
const supabaseKey = "sb_publishable_5ydnIunxMt5iHocxpzHnww_EYeLpF_L";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .or("username.ilike.john_2,full_name.ilike.john_2")
    .maybeSingle();

  console.log("OR Data:", data);
  console.log("OR Error:", error);
}

check();
