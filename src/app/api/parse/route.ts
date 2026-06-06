import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { thread } = await req.json()
  if (!thread?.trim()) return NextResponse.json({ error: 'No thread provided' }, { status: 400 })

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: `You are a scheduling intelligence system. Extract all scheduling constraints from this email thread.

Return ONLY valid JSON:
{
  "attendees": [{ "name": string, "email": string | null, "timezone": string | null, "role": string | null }],
  "availableWindows": [{ "person": string, "windows": string[], "constraints": string[] }],
  "meetingRequirements": { "duration": string | null, "type": string | null, "platform": string | null, "notes": string[] },
  "blockers": string[],
  "urgency": "high" | "medium" | "low",
  "summary": string
}

EMAIL THREAD:
${thread}` }]
    })
  })

  const data = await res.json()
  try {
    const text = data.choices[0].message.content
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: data.choices?.[0]?.message?.content, groqError: data.error }, { status: 500 })
  }
}
