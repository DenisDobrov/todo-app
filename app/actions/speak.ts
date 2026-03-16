'use server'

export async function generateSpeech(text: string) {
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
      })
    })

    if (!res.ok) {
      const error = await res.json()
      console.error('OpenAI TTS Error:', error)
      return null
    }

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer).toString('base64')
  } catch (e) {
    console.error('TTS Exception:', e)
    return null
  }
}