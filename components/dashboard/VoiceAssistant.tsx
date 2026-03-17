'use client'

import { useState, useRef } from 'react';
import { processVoiceTask } from '@/app/actions/process-voice';

export function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await sendAudioToAI(audioBlob);
        // Останавливаем все дорожки микрофона
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setLastResponse(null);
    } catch (err) {
      console.error("Ошибка доступа к микрофону:", err);
      alert("Доступ к микрофону запрещен");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToAI = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      // Whisper лучше всего понимает файлы с расширением .webm или .mp3
      formData.append('audio', blob, 'recording.webm');

      const result = await processVoiceTask(formData);

      if (result.success) {
        setLastResponse(result.response_phrase);
        
        // Озвучиваем ответ (опционально)
        const utterance = new SpeechSynthesisUtterance(result.response_phrase);
        utterance.lang = 'ru-RU'; // Или 'en-US' в зависимости от твоего контента
        window.speechSynthesis.speak(utterance);

        // ОБРАБОТКА UI КОМАНД (Навигация)
        if (result.action === 'ui_navigation' && result.params?.target) {
          const element = document.getElementById(
            result.params.target === 'learning' ? 'learning-path' : 'tasks-section'
          );
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (err) {
      console.error("Ошибка при обработке голоса:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      {/* Облачко с ответом над кнопкой */}
      {lastResponse && (
        <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-gray-100 text-sm font-medium text-gray-700 animate-in fade-in slide-in-from-bottom-2">
          {lastResponse}
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full p-2 flex items-center gap-4 pr-8 transition-all hover:scale-[1.02]">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-50
            ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-900 hover:bg-black'}`}
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-xl">{isRecording ? '⏹' : '🎙️'}</span>
          )}
        </button>
        
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Soluter AI</p>
          <p className="text-sm font-bold text-gray-900">
            {isRecording ? 'Listening...' : isProcessing ? 'Thinking...' : 'Tap to speak'}
          </p>
        </div>
      </div>
    </div>
  );
}