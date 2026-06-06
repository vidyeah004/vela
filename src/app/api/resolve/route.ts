import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { parsed } = await req.json()

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: `You are a scheduling conflict resolution engine. Find the best meeting slots.

Return ONLY valid JSON:
{
  "recommendedSlots": [{ "rank": number, "datetime": string, "duration": string, "confidence": "high" | "medium" | "low", "reasoning": string, "conflicts": string[] }],
  "conflicts": [{ "description": string, "affectedParties": string[], "resolution": string }],
  "timezoneMap": [{ "person": string, "timezone": string, "localTime": string }],
  "recommendation": string
}

CONSTRAINTS:
${JSON.stringify(parsed, null, 2)}` }]
    })
  })

  const data = await res.json()
  try {
    const text = data.choices[0].message.content
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Resolve failed', raw: data.choices?.[0]?.message?.content, groqError: data.error }, { status: 500 })
  }
}
