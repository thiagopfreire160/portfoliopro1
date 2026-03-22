/**
 * api/chat.js — Vercel Serverless Function
 *
 * Proxy para a API do Typebot.
 *
 * Variáveis de ambiente:
 *   TYPEBOT_API_TOKEN  → token da API do Typebot
 *   TYPEBOT_PUBLIC_ID  → public ID do bot publicado
 */

export const config = { runtime: 'edge' };

const TYPEBOT_API_BASE = 'https://typebot.io/api/v1';

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    const token = process.env.TYPEBOT_API_TOKEN;
    const publicId = process.env.TYPEBOT_PUBLIC_ID;

    if (!token || !publicId) {
      return new Response(
        JSON.stringify({ error: 'TYPEBOT_API_TOKEN ou TYPEBOT_PUBLIC_ID não configurados no Vercel.' }),
        { status: 500, headers }
      );
    }

    const action = body.action || 'continue';

    if (action === 'start') {
      const typebotRes = await fetch(`${TYPEBOT_API_BASE}/typebots/${publicId}/startChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          textBubbleContentFormat: 'markdown',
          prefilledVariables: body.prefilledVariables || {},
        }),
      });

      const payload = await typebotRes.json();

      if (!typebotRes.ok) {
        return new Response(JSON.stringify({ error: payload?.message || 'Erro ao iniciar chat no Typebot', details: payload }), {
          status: typebotRes.status,
          headers,
        });
      }

      return new Response(JSON.stringify(normalizeTypebotResponse(payload, true)), { status: 200, headers });
    }

    if (!body.sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId é obrigatório para continuar o chat.' }), {
        status: 400,
        headers,
      });
    }

    const typebotRes = await fetch(`${TYPEBOT_API_BASE}/sessions/${body.sessionId}/continueChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: body.message,
        textBubbleContentFormat: 'markdown',
      }),
    });

    const payload = await typebotRes.json();

    if (!typebotRes.ok) {
      return new Response(JSON.stringify({ error: payload?.message || 'Erro ao continuar chat no Typebot', details: payload }), {
        status: typebotRes.status,
        headers,
      });
    }

   const responseData = normalizeTypebotResponse(payload, false, body.sessionId);

// salva no supabase
await saveLead({
  session_id: responseData.sessionId,
  message: body.message || '',
  response: responseData.content || ''
});

return new Response(JSON.stringify(responseData), { status: 200, headers });
  } catch (err) {
    console.error('Typebot handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
}

function normalizeTypebotResponse(payload, isStart = false, fallbackSessionId = null) {
  const rawMessages = isStart ? payload?.typebot?.messages || [] : payload?.messages || [];
  const textMessages = rawMessages
    .map(extractMessageText)
    .filter(Boolean);
async function saveLead(data) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return;

  await fetch(`${url}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
}
  return {
    sessionId: payload?.sessionId || fallbackSessionId || null,
    messages: textMessages,
    content: textMessages.join('\n\n'),
    input: payload?.input || null,
    clientSideActions: payload?.clientSideActions || [],
    progress: payload?.progress ?? null,
  };
}

function extractMessageText(message) {
  if (!message) return '';

  if (typeof message === 'string') return message;

  if (message.type === 'text') {
    const content = message.content;

    if (typeof content === 'string') return content;

    if (content?.markdown) return content.markdown;

    if (typeof content?.richText === 'string') {
      return content.richText
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
  }

  return '';
}
