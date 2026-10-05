import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ ok: false, error: "Nur POST ist erlaubt." }, 405);

    try {
      const body = await req.json();
      const action = String(body.action || "");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");

      if (!supabaseUrl || !secretKeysRaw) {
        return json({ ok: false, error: "Supabase-Konfiguration fehlt." }, 500);
      }

      const secretKeys = JSON.parse(secretKeysRaw);
      const secretKey = secretKeys.default;
      const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim().toLowerCase();
      if (!secretKey) return json({ ok: false, error: "Supabase Secret Key fehlt." }, 500);

      const admin = createClient(supabaseUrl, secretKey);

      if (action === "verify-game-password") {
        const password = String(body.password || "");
        if (!password) return json({ ok: false, error: "Kein Passwort eingegeben." }, 400);

        const hash = await sha256(password);
        const { data, error } = await admin
          .from("game_settings")
          .select("game_password_hash")
          .eq("id", 1)
          .single();

        if (error || !data) {
          console.error("game_settings read error", error);
          return json({ ok: false, error: "Passwortdaten konnten nicht geladen werden." }, 500);
        }

        if (hash !== data.game_password_hash) {
          return json({ ok: false, error: "Falsches Spielpasswort." }, 401);
        }

        return json({ ok: true });
      }

      if (action === "change-game-password") {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return json({ ok: false, error: "Admin-Anmeldung erforderlich." }, 401);
        }

        const token = authHeader.slice(7);
        const { data: userData, error: userError } = await admin.auth.getUser(token);
        if (userError || !userData.user || !adminEmail || userData.user.email?.toLowerCase() !== adminEmail) {
          return json({ ok: false, error: "Keine Berechtigung für den Adminbereich." }, 403);
        }

        const newPassword = String(body.newPassword || "");
        if (newPassword.length < 4) {
          return json({ ok: false, error: "Das neue Spielpasswort muss mindestens 4 Zeichen haben." }, 400);
        }

        const newHash = await sha256(newPassword);
        const { error: updateError } = await admin
          .from("game_settings")
          .update({ game_password_hash: newHash })
          .eq("id", 1);

        if (updateError) {
          console.error("game_settings update error", updateError);
          return json({ ok: false, error: "Das Spielpasswort konnte nicht geändert werden." }, 500);
        }

        return json({ ok: true, message: "Spielpasswort wurde geändert." });
      }

      return json({ ok: false, error: "Unbekannte Aktion." }, 400);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: "Serverfehler." }, 500);
    }
  },
};
