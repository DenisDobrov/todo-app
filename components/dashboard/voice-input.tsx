'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { processVoiceTask } from '@/app/actions/process-voice'
import { toast } from 'sonner'

interface VoiceInputProps {
  onAction: (action: string, params: any) => void;
}

export function VoiceInput({ onAction }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [step, setStep] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const start = async () => {
    // 1. Сначала разблокируем аудио для iOS
    const unlocker = new Audio();
    unlocker.play().catch(() => {});

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Выбираем формат, который лучше всего понимает Whisper
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/mp4'; // Для Safari на iOS
      }

      mediaRecorder.current = new MediaRecorder(stream, options)
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        setStep('Думаю...')
        
        // Создаем Blob только когда уверены, что чанки есть
        const audioBlob = new Blob(chunks.current, { type: mediaRecorder.current?.mimeType })
        
        console.log("📏 Размер отправляемого аудио:", audioBlob.size);

        if (audioBlob.size < 100) {
          toast.error("Запись слишком короткая")
          setStep(null)
          return
        }

        const fd = new FormData()
        // Важно: даем расширение файла, чтобы OpenAI понял формат
        fd.append('audio', audioBlob, options.mimeType.includes('webm') ? 'audio.webm' : 'audio.mp4')

        const res = await processVoiceTask(fd)
        
        if (res.transcript) setTranscript(res.transcript)
        if (res.action === 'ui_filter') onAction('filter', res.params)
        
        toast(res.response_phrase)
        setStep(null)
        // Очищаем текст через 5 сек
        setTimeout(() => setTranscript(''), 5000)
      }

      // Записываем маленькими кусочками каждые 100мс (timeslice)
      // Это гарантирует, что ondataavailable сработает вовремя
      mediaRecorder.current.start(100) 
      setIsRecording(true)
      setStep('Слушаю...')
    } catch (e) {
      toast.error("Ошибка микрофона. Проверьте разрешения.")
      console.error(e)
    }
  }

  const stop = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button 
        variant={isRecording ? "destructive" : "default"} 
        className={`rounded-full w-16 h-16 shadow-lg transition-all ${isRecording ? 'animate-pulse scale-110' : ''}`}
        onClick={isRecording ? stop : start}
        disabled={step === 'Думаю...'}
      >
        {step === 'Думаю...' ? <Loader2 className="animate-spin h-8 w-8" /> : <Mic className="h-8 w-8" />}
      </Button>
      <div className="text-center h-4">
        {step && <p className="text-xs text-blue-500 font-medium animate-pulse">{step}</p>}
        {transcript && !step && (
          <p className="text-xs text-slate-400 italic bg-slate-100 px-2 py-1 rounded-md">
            «{transcript}»
          </p>
        )}
      </div>
    </div>
  )
}