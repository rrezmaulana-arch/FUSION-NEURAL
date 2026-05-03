/// <reference types="node" />
// api/midtrans.ts — FusionNeural Payment Gateway
// FIX #5: URL & Client Key tidak lagi di-hardcode.
// Gunakan env var MIDTRANS_ENV=production untuk live mode,
// default ke sandbox jika tidak di-set.

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return new Response(JSON.stringify({ error: 'MIDTRANS_SERVER_KEY not configured in Vercel env vars' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encodedKey = btoa(serverKey + ':');

    // FIX #5: Gunakan env var untuk switch otomatis sandbox ↔ production.
    // Set MIDTRANS_ENV=production di Vercel untuk menerima uang sungguhan.
    const isProduction = process.env.MIDTRANS_ENV === 'production';
    const apiUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Midtrans] Error:', data);
      return new Response(
        JSON.stringify({ error: data.error_messages || 'Midtrans API error', details: data }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ token: data.token, redirect_url: data.redirect_url, mode: isProduction ? 'production' : 'sandbox' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('[Midtrans] Internal Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
