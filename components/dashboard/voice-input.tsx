'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { processVoiceTask } from '@/app/actions/process-voice'
import { generateSpeech } from '@/app/actions/speak'
import { toast } from 'sonner'

// Making refresh after task creation
import { useRouter } from 'next/navigation'

export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const router = useRouter() // 2. Инициализируй роутер

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
    
    // --- ГЛУБОКИЙ ХАК ДЛЯ iOS ---
    // 1. Создаем аудио-контекст принудительно
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // 2. Создаем и запускаем пустой буфер (тишина)
    const source = audioCtx.createBufferSource();
    source.buffer = audioCtx.createBuffer(1, 1, 22050);
    source.connect(audioCtx.destination);
    source.start(0);

    // 3. Если контекст "спит", будим его (важно для iOS 17+)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    // ----------------------------

    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    try {
      const result = await processVoiceTask(formData) as any

      if (result.response_phrase) {
        try {
          const audioBase64 = await generateSpeech(result.response_phrase)
          if (audioBase64) {
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
            
            // На iOS лучше играть через созданный контекст или явно через метод play
            audio.play().catch(err => {
              console.error("Всё еще блокируется iOS:", err);
              // Запасной вариант: попробовать нажать кнопку "воспроизвести" скрыто
              toast.error("Нажмите еще раз, чтобы услышать ответ");
            });
          }
        } catch (speechErr) {
          console.error("Ошибка TTS:", speechErr)
        }
      }

      if (result.success) {
        toast.success('Задача добавлена!')
        // Рефреш страницы через 2 секунды (чтобы звук успел проиграться)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error(result.error || 'Ошибка обработки')
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