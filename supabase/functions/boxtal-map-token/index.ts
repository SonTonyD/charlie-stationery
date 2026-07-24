const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const boxtalAuthenticationUrl =
  'https://api.boxtal.com/iam/account-app/token';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const accessKey = Deno.env.get('BOXTAL_MAP_ACCESS_KEY');
    const secretKey = Deno.env.get('BOXTAL_MAP_SECRET_KEY');

    if (!accessKey || !secretKey) {
      return jsonResponse(
        { error: 'Boxtal map credentials are not configured' },
        503,
      );
    }

    const credentials = btoa(`${accessKey}:${secretKey}`);
    const authenticationResponse = await fetch(boxtalAuthenticationUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });
    const responseText = await authenticationResponse.text();

    if (!authenticationResponse.ok) {
      console.error(
        'Boxtal authentication failed:',
        authenticationResponse.status,
        responseText,
      );
      return jsonResponse(
        {
          error: 'Boxtal authentication failed',
          status: authenticationResponse.status,
        },
        502,
      );
    }

    let authenticationData: Record<string, unknown>;
    try {
      authenticationData = JSON.parse(responseText);
    } catch {
      console.error('Unexpected Boxtal authentication response');
      return jsonResponse(
        { error: 'Unexpected Boxtal authentication response' },
        502,
      );
    }

    const accessToken =
      authenticationData['accessToken'] ??
      authenticationData['access_token'] ??
      authenticationData['token'];

    if (typeof accessToken !== 'string' || !accessToken) {
      console.error(
        'Access token missing from Boxtal response:',
        Object.keys(authenticationData),
      );
      return jsonResponse(
        { error: 'Access token missing from Boxtal response' },
        502,
      );
    }

    return jsonResponse({ accessToken });
  } catch (error) {
    console.error('boxtal-map-token error:', error);
    return jsonResponse(
      { error: 'Unable to retrieve the Boxtal access token' },
      500,
    );
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
