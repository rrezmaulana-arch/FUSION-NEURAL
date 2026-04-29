// api/notify.ts — Secure Telegram Notification Relay
// Token hanya ada di server, tidak pernah ke browser

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { chatId, text, parseMode = 'Markdown' } = await req.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), { status: 500 });
    }

    if (!chatId || !text) {
      return new Response(JSON.stringify({ error: 'chatId and text are required' }), { status: 400 });
    }

    const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });

    const data = await result.json();
    return new Response(JSON.stringify(data), {
      status: result.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
