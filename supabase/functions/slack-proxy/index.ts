const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { slackToken, endpoint, params } = await req.json();

    if (!slackToken || !endpoint) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing slackToken or endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allowedEndpoints = [
      'auth.test',
      'users.list',
      'conversations.list',
      'conversations.history',
      'chat.postMessage',
    ];

    if (!allowedEndpoints.includes(endpoint)) {
      return new Response(
        JSON.stringify({ ok: false, error: `Endpoint not allowed: ${endpoint}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(`https://slack.com/api/${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }

    let slackRes;
    if (endpoint === 'chat.postMessage') {
      slackRes = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    } else {
      slackRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${slackToken}` },
      });
    }

    const data = await slackRes.json();

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
