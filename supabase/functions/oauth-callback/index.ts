// Supabase Edge Function: Handle OAuth callbacks for Slack
// Gmail OAuth is handled by Supabase Auth directly;
// this function handles the Slack OAuth code exchange.
//
// Expects: GET ?code=...&state=... (Slack redirect)
// Requires: SUPABASE_SERVICE_ROLE_KEY, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user's access_token for auth

    if (!code) {
      return new Response('Missing code parameter', { status: 400 });
    }

    // Exchange code for Slack token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('SLACK_CLIENT_ID')!,
        client_secret: Deno.env.get('SLACK_CLIENT_SECRET')!,
        code,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.ok) {
      return new Response(
        JSON.stringify({ error: tokenData.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from the state (their Supabase access token)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the user's session
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(state!);

    if (userError || !user) {
      return new Response('Invalid user session', { status: 401 });
    }

    // Store the Slack integration
    const accessToken = tokenData.authed_user?.access_token || tokenData.access_token;
    const teamName = tokenData.team?.name || 'Workspace';

    await supabase.from('integrations').upsert(
      {
        user_id: user.id,
        platform: 'slack',
        access_token: accessToken,
        scopes: tokenData.authed_user?.scope?.split(',') || [],
        platform_user_id: tokenData.authed_user?.id,
        platform_metadata: {
          workspace: teamName,
          teamId: tokenData.team?.id,
        },
        is_active: true,
        sync_error: null,
      },
      { onConflict: 'user_id,platform' }
    );

    // Redirect back to settings
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    return Response.redirect(`${appUrl}/settings?slack=connected`, 302);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
