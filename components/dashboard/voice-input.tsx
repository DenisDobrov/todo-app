'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { processVoiceTask } from '@/app/actions/process-voice'
import { generateSpeech } from '@/app/actions/speak'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('') // Текст того, что вы сказали
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const router = useRouter()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Важно: проверяем поддержку форматов, audio/webm обычно надежнее для Chrome/Android
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      
      mediaRecorder.current = new MediaRecorder(stream, { mimeType })
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType })
        if (audioBlob.size > 0) {
          await handleVoiceProcess(audioBlob)
        } else {
          setIsProcessing(false)
          toast.error("Запись оказалась пустой")
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setLastTranscript('') // Сбрасываем старый текст
    } catch (err) {
      toast.error('Микрофон недоступен')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      // Обязательно выключаем микрофон (лампочку на панели)
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleVoiceProcess = async (blob: Blob) => {
    setIsProcessing(true)
    
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    try {
      const result = await processVoiceTask(formData) as any

      // 1. Показываем транскрипцию (что услышал Whisper)
      if (result.transcript) {
        setLastTranscript(result.transcript)
      }

      // 2. Озвучка ответа
      if (result.response_phrase) {
        try {
          const audioBase64 = await generateSpeech(result.response_phrase)
          if (audioBase64) {
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
            await audio.play()
          }
        } catch (e) { console.error("TTS Error", e) }
      }

      // 3. Уведомление и обновление
      if (result.success) {
        toast.success(result.response_phrase || 'Готово')
        router.refresh()
        // Если была команда на удаление или изменение — лучше обновить страницу через 2с
        if (result.response_phrase?.includes("удалил") || result.response_phrase?.includes("отметил")) {
          setTimeout(() => window.location.reload(), 2000)
        }
      } else {
        toast.error(result.error || 'Не удалось распознать команду')
      }

    } catch (error) {
      console.error('Критическая ошибка:', error)
      toast.error('Ошибка связи с сервером')
    } finally {
      setIsProcessing(false)
      // Очищаем транскрипт через 7 секунд
      setTimeout(() => setLastTranscript(''), 7000)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {isRecording ? (
          <Button 
            variant="destructive" 
            size="lg" 
            className="rounded-full h-16 w-16 shadow-xl animate-pulse"
            onClick={stopRecording}
          >
            <Square className="h-8 w-8" />
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="lg" 
            className="rounded-full h-16 w-16 shadow-xl bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
            onClick={startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        )}
      </div>

      {/* Вывод того, что пользователь сказал (Transcript) */}
      <div className="h-4">
        {lastTranscript && (
          <p className="text-sm text-slate-400 italic animate-in fade-in slide-in-from-top-1 duration-500">
            «{lastTranscript}»
          </p>
        )}
      </div>
    </div>
  )
}