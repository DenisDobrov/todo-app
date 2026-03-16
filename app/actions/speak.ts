'use server'

export async function generateSpeech(text: string) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy', // Можно попробовать 'shimmer' или 'echo'
    })
  })

  const arrayBuffer = await res.arrayBuffer()
  // Конвертируем в base64, чтобы передать на клиент
  return Buffer.from(arrayBuffer).toString('base64')
}