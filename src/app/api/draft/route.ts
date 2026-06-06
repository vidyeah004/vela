import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { parsed, resolved, selectedSlot } = await req.json()

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: `You are a professional scheduling assistant. Draft a clean, concise coordination email to confirm this meeting.

Return ONLY valid JSON, no markdown, no explanation:
{
  "subject": string,
  "body": string,
  "calendarInviteDetails": {
    "title": string,
    "datetime": string,
    "duration": string,
    "attendees": string[],
    "platform": string | null,
    "agenda": string[]
  },
  "followUpActions": string[]
}

The email should be professional, warm, and brief. Include timezone conversions for all attendees. No fluff.

MEETING CONTEXT:
${JSON.stringify({ parsed, selectedSlot: selectedSlot || resolved?.recommendedSlots?.[0] }, null, 2)}`
      }]
    })
  })

  const data = await res.json()
  try {
    const text = data.choices[0].message.content
    const result = JSON.parse(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Draft failed', raw: data.choices?.[0]?.message?.content }, { status: 500 })
  }
}
