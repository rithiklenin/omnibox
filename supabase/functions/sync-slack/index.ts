// Supabase Edge Function: Sync Slack messages for a user
// Triggered by pg_cron every 5 minutes or manually via POST
//
// Expects: POST { userId: string }
// Requires: SUPABASE_SERVICE_ROLE_KEY

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
    const { userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the user's Slack integration
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'slack')
      .eq('is_active', true)
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: 'No active Slack integration found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = integration.access_token;

    // Get list of conversations the user is in
    const convResponse = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel,private_channel,im,mpim&limit=100',
      { headers: { Authorization: `Bearer ${botToken}` } }
    );

    const convData = await convResponse.json();
    if (!convData.ok) {
      await supabase
        .from('integrations')
        .update({ sync_error: `Slack API error: ${convData.error}` })
        .eq('id', integration.id);
      return new Response(
        JSON.stringify({ error: convData.error }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user cache for resolving names
    const userCache: Record<string, string> = {};
    const usersResponse = await fetch(
      'https://slack.com/api/users.list?limit=200',
      { headers: { Authorization: `Bearer ${botToken}` } }
    );
    const usersData = await usersResponse.json();
    if (usersData.ok) {
      for (const user of usersData.members || []) {
        userCache[user.id] = user.real_name || user.name || user.id;
      }
    }

    let totalSynced = 0;
    const oldest = integration.sync_cursor || '0';

    // Fetch history from each conversation
    for (const channel of (convData.channels || []).slice(0, 20)) {
      const historyUrl = new URL('https://slack.com/api/conversations.history');
      historyUrl.searchParams.set('channel', channel.id);
      historyUrl.searchParams.set('oldest', oldest);
      historyUrl.searchParams.set('limit', '20');

      const histResponse = await fetch(historyUrl.toString(), {
        headers: { Authorization: `Bearer ${botToken}` },
      });

      const histData = await histResponse.json();
      if (!histData.ok) continue;

      for (const msg of histData.messages || []) {
        if (msg.subtype && msg.subtype !== 'bot_message') continue;

        const senderName = userCache[msg.user] || msg.username || 'Unknown';
        const text = msg.text || '';
        const ts = msg.ts;

        await supabase.from('messages').upsert(
          {
            user_id: userId,
            integration_id: integration.id,
            platform: 'slack',
            external_id: `${channel.id}-${ts}`,
            thread_id: msg.thread_ts || ts,
            sender_name: senderName,
            sender_platform_id: msg.user,
            subject: channel.is_im ? 'Direct Message' : `#${channel.name}`,
            channel_name: channel.name || 'DM',
            preview: text.slice(0, 200),
            content: text,
            is_unread: true,
            received_at: new Date(parseFloat(ts) * 1000).toISOString(),
          },
          { onConflict: 'user_id,platform,external_id' }
        );
        totalSynced++;
      }
    }

    // Update sync cursor to current time
    await supabase
      .from('integrations')
      .update({
        sync_cursor: String(Date.now() / 1000),
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('id', integration.id);

    return new Response(
      JSON.stringify({ success: true, synced: totalSynced }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
