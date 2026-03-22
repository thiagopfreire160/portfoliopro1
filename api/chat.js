/**
 * api/chat.js — Vercel Serverless Function (Node.js)
 * Claude API + Supabase
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, system, sessionId, leadData } = req.body;

    if (!messages || !system) {
      return res.status(400).json({ error: 'Missing messages or system' });
    }

    const claudeRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude API error:', err);
      return res.status(500).json({ error: 'Claude API error', detail: err });
    }

    const claudeData = await claudeRes.json();
    const reply = claudeData.content?.[0]?.text ?? 'Desculpe, tente novamente.';

    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      saveLead({ sessionId, leadData, messages, reply }).catch(e =>
        console.error('Supabase error:', e)
      );
    }

    return res.status(200).json({ content: reply });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}

async function saveLead({ sessionId, leadData, messages, reply }) {
  const base = `${process.env.SUPABASE_URL}/rest/v1/leads`;
  const headers = {
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  };

  const payload = {
    session_id: sessionId,
    nome:     leadData?.nome    || null,
    negocio:  leadData?.negocio || null,
    plano:    leadData?.plano   || null,
    email:    leadData?.email   || null,
    phone:    leadData?.phone   || null,
    historico: JSON.stringify(messages),
    ultima_mensagem: reply,
    updated_at: new Date().toISOString(),
  };

  await fetch(base, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}
