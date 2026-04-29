/// <reference types="node" />
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-umbvOIGiXz0anZS1FkQBIbKQ';
    const encodedKey = btoa(serverKey + ':');

    // Force Sandbox as requested
    const apiUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Midtrans Error:', data);
      return new Response(JSON.stringify({ error: data.error_messages || 'Midtrans API error', details: data }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ token: data.token, redirect_url: data.redirect_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Internal Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
