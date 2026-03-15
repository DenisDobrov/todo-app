'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { processVoiceTask } from '@/app/actions/process-voice'
import { toast } from 'sonner' // Если используешь sonner для уведомлений

export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    audioChunks.current = []

    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data)
    }

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
      await sendAudioToServer(audioBlob)
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
    setIsProcessing(true)
  }

  const sendAudioToServer = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    const result = await processVoiceTask(formData)
    
    setIsProcessing(false)
    if (result.success) {
      toast.success(`Добавлено: ${result.task.title}`)
    } else {
      toast.error('Ошибка обработки голоса')
    }
  }

  return (
    <Button 
      variant={isRecording ? "destructive" : "default"}
      disabled={isProcessing}
      onClick={isRecording ? stopRecording : startRecording}
      className="rounded-full w-12 h-12 p-0 shadow-lg"
    >
      {isProcessing ? (
        <Loader2 className="animate-spin" />
      ) : isRecording ? (
        <Square className="fill-current" />
      ) : (
        <Mic />
      )}
    </Button>
  )
}