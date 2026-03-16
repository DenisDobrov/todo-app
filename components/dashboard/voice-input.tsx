'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { processVoiceTask } from '@/app/actions/process-voice'
import { generateSpeech } from '@/app/actions/speak'
import { toast } from 'sonner'

export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        await handleVoiceProcess(audioBlob)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      toast.error('Доступ к микрофону запрещен')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleVoiceProcess = async (blob: Blob) => {
    setIsProcessing(true)
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    try {
      // 1. Обработка задачи
      const result = await processVoiceTask(formData)

      if (result.success && result.task) {
        toast.success('Задача добавлена!')
        
        // 2. Формируем текст для озвучки
        const date = result.task.due_at 
          ? new Date(result.task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null
        
        const speechText = date 
          ? `Окей, добавил задачу: ${result.task.title} на ${date}`
          : `Окей, добавил задачу: ${result.task.title}`

        // 3. Генерация и воспроизведение голоса
        try {
          const audioBase64 = await generateSpeech(speechText)
          if (audioBase64) {
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
            // Важно: play() возвращает promise, подождем его
            await audio.play()
          } else {
            console.warn("Голос не пришел от API")
          }
        } catch (speechErr) {
          console.error("Ошибка TTS:", speechErr)
        }
      } else {
        toast.error(result.error || 'Не удалось распознать задачу')
      }
    } catch (error) {
      console.error('Критическая ошибка:', error)
      toast.error('Ошибка соединения')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <Button 
          variant="destructive" 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg animate-pulse"
          onClick={stopRecording}
        >
          <Square className="h-6 w-6" />
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700"
          onClick={startRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      )}
    </div>
  )
}