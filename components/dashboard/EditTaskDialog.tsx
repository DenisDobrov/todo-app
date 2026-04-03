'use client'

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCcw, Sparkles } from "lucide-react"
import { formatToInputDateTime } from "@/lib/utils/date-utils"
import { useRouter } from 'next/navigation' // Импортируй роутер

// Добавь импорт экшена создания, если он у тебя в том же файле, что и updateTask
import { updateTask, createTask } from "@/app/dashboard/actions"

export function EditTaskDialog({ task, projects, open, onOpenChange }: any) {
  const router = useRouter() // Инициализируй
  const [loading, setLoading] = useState(false)

  // Инициализация: если task есть — редактируем, если нет — создаем новую
  const isEdit = !!task;

// Инициализируем через функцию, чтобы безопасно обработать отсутствие task
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_at: "",
    project_id: projects[0]?.id || "",
    priority: "medium",
    is_all_day: false,
    recurrence: "none"
  })

// Важно: сбрасывать форму, когда открываем диалог на СОЗДАНИЕ (чтобы не оставались старые данные)
// Этот эффект "наполняет" форму при открытии
  useEffect(() => {
    if (open) {
      if (isEdit && task) {
        setFormData({
          title: task.title || "",
          description: task.description || "",
          due_at: task.due_at ? formatToInputDateTime(task.due_at) : "",
          project_id: task.project_id,
          priority: task.priority || "medium",
          is_all_day: task.is_all_day || false,
          recurrence: task.recurrence || "none"
        });
      } else {
        // Сброс для НОВОЙ задачи
        setFormData({
          title: "",
          description: "",
          due_at: "",
          project_id: projects[0]?.id || "",
          priority: "medium",
          is_all_day: false,
          recurrence: "none"
        });
      }
    }
  }, [open, isEdit, task, projects]);

  const isSomedayProject = projects.find(
    (p: any) => p.id === formData.project_id && p.title === "Когда-нибудь"
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        due_at: isSomedayProject ? null : (formData.is_all_day ? formData.due_at.split('T')[0] : formData.due_at),
        recurrence: formData.recurrence === "none" ? null : formData.recurrence
      }
      
      if (isEdit) {
        await updateTask(task.id, dataToSave)
      } else {
        await createTask(dataToSave)
      }
      onOpenChange(false)
      router.refresh()    // КРИТИЧНО: заставляет серверные компоненты обновиться
    } catch (error) {
      alert(isEdit ? "Ошибка обновления" : "Ошибка создания")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{isEdit ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Форма редактирования задачи"
              : "Форма создания новой задачи"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 flex-1 custom-scrollbar">
          <form id="edit-task-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4 py-4">
            
            {/* Название */}
            <div className="space-y-2">
              <Label>Название</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required 
              />
            </div>

            {/* Проект */}
            <div className="space-y-2">
              <Label>Проект</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(v) => setFormData({...formData, project_id: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Блок даты и повтора: скрываем, если это Someday */}
            {!isSomedayProject ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox 
                      id="is_all_day" 
                      checked={formData.is_all_day}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: !!checked })}
                    />
                    <Label htmlFor="is_all_day" className="text-sm cursor-pointer">Весь день</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Приоритет</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(v) => setFormData({...formData, priority: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{formData.is_all_day ? "Дата" : "Дедлайн"}</Label>
                    <Input 
                      type={formData.is_all_day ? "date" : "datetime-local"} 
                      value={formData.is_all_day ? formData.due_at.split('T')[0] : formData.due_at}
                      onChange={(e) => setFormData({...formData, due_at: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <RefreshCcw className="w-3 h-3" /> Повтор
                    </Label>
                    <Select 
                      value={formData.recurrence || "none"} 
                      onValueChange={(v) => setFormData({...formData, recurrence: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без повтора</SelectItem>
                        <SelectItem value="daily">Ежедневно</SelectItem>
                        <SelectItem value="weekly">Еженедельно</SelectItem>
                        <SelectItem value="monthly">Ежемесячно</SelectItem>
                        <SelectItem value="yearly">Ежегодно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-300">
                <Sparkles className="w-5 h-5 text-slate-400" />
                <p className="text-[11px] text-slate-500 font-medium text-center">
                  В проекте «Когда-нибудь» задачи хранятся без даты и не попадают в календарь
                </p>
              </div>
            )}

            {/* Описание */}
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea 
                placeholder="Добавьте детали..."
                className="min-h-[120px] max-h-[300px] overflow-y-auto leading-relaxed"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="h-4" />
          </form>
        </div>

        <DialogFooter className="p-6 pt-2 bg-slate-50/50 border-t flex flex-col sm:flex-row items-center gap-3">
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Нажмите <kbd className="font-sans border rounded px-1 bg-white">Ctrl</kbd> + <kbd className="font-sans border rounded px-1 bg-white">Enter</kbd>
          </p>
          <Button form="edit-task-form" type="submit" disabled={loading} className="w-full sm:w-auto shadow-sm">
              {loading ? "Загрузка..." : isEdit ? "Сохранить изменения" : "Создать задачу"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}