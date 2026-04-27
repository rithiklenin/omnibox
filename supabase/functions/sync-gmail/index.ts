// Supabase Edge Function: Sync Gmail messages for a user
// Triggered by pg_cron every 2 minutes or manually via POST
//
// Expects: POST { userId: string }
// Requires: SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

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

    // Get the user's Gmail integration
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'gmail')
      .eq('is_active', true)
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: 'No active Gmail integration found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token if expired
    let accessToken = integration.access_token;
    if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await refreshResponse.json();
      if (tokens.access_token) {
        accessToken = tokens.access_token;
        await supabase
          .from('integrations')
          .update({
            access_token: tokens.access_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          })
          .eq('id', integration.id);
      }
    }

    // Fetch messages from Gmail API
    const gmailUrl = integration.sync_cursor
      ? `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${integration.sync_cursor}&historyTypes=messageAdded`
      : 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50';

    const gmailResponse = await fetch(gmailUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!gmailResponse.ok) {
      const errText = await gmailResponse.text();
      await supabase
        .from('integrations')
        .update({ sync_error: `Gmail API error: ${gmailResponse.status}` })
        .eq('id', integration.id);
      return new Response(
        JSON.stringify({ error: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const gmailData = await gmailResponse.json();

    // Get message IDs to fetch
    let messageIds: string[] = [];
    if (integration.sync_cursor && gmailData.history) {
      for (const h of gmailData.history) {
        if (h.messagesAdded) {
          for (const m of h.messagesAdded) {
            messageIds.push(m.message.id);
          }
        }
      }
    } else if (gmailData.messages) {
      messageIds = gmailData.messages.map((m: { id: string }) => m.id);
    }

    // Fetch full message details
    let synced = 0;
    for (const msgId of messageIds.slice(0, 50)) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgResponse.ok) continue;

      const msg = await msgResponse.json();
      const headers = msg.payload?.headers || [];
      const from = headers.find((h: { name: string }) => h.name === 'From')?.value || 'Unknown';
      const subject = headers.find((h: { name: string }) => h.name === 'Subject')?.value || '';
      const date = headers.find((h: { name: string }) => h.name === 'Date')?.value || '';

      const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
      const senderName = senderMatch ? senderMatch[1].replace(/"/g, '') : from;
      const senderEmail = senderMatch ? senderMatch[2] : from;

      const snippet = msg.snippet || '';

      await supabase.from('messages').upsert(
        {
          user_id: userId,
          integration_id: integration.id,
          platform: 'gmail',
          external_id: msgId,
          thread_id: msg.threadId,
          sender_name: senderName,
          sender_email: senderEmail,
          subject,
          preview: snippet.slice(0, 200),
          content: snippet,
          is_unread: msg.labelIds?.includes('UNREAD') ?? false,
          received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        },
        { onConflict: 'user_id,platform,external_id' }
      );
      synced++;
    }

    // Update sync cursor
    const newHistoryId = gmailData.historyId || integration.sync_cursor;
    await supabase
      .from('integrations')
      .update({
        sync_cursor: newHistoryId,
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('id', integration.id);

    return new Response(
      JSON.stringify({ success: true, synced }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
