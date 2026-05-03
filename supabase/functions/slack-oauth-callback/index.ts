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
    const { code, userId, redirectUri } = await req.json();

    if (!code || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing code or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('SLACK_CLIENT_ID');
    const clientSecret = Deno.env.get('SLACK_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Slack app not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    };
    if (redirectUri) {
      params.redirect_uri = redirectUri;
    }

    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      return new Response(
        JSON.stringify({ error: `Slack OAuth error: ${tokenData.error}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;
    const teamName = tokenData.team?.name || '';
    const teamId = tokenData.team?.id || '';
    const botUserId = tokenData.bot_user_id || '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('integrations').upsert(
      {
        user_id: userId,
        platform: 'slack',
        access_token: accessToken,
        scopes: tokenData.scope?.split(',') || [],
        platform_user_id: botUserId,
        platform_metadata: { team_name: teamName, team_id: teamId },
        is_active: true,
        sync_error: null,
      },
      { onConflict: 'user_id,platform' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        access_token: accessToken,
        team_name: teamName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
