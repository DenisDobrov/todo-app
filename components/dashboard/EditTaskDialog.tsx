'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTask } from "@/app/dashboard/actions"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCcw } from "lucide-react"
import { formatToInputDateTime } from "@/lib/utils/date-utils"

export function EditTaskDialog({ task, projects, open, onOpenChange }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    due_at: formatToInputDateTime(task.due_at),
    project_id: task.project_id,
    priority: task.priority,
    is_all_day: task.is_all_day || false,
    recurrence: task.recurrence || "none"
  })

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
        due_at: formData.is_all_day ? formData.due_at.split('T')[0] : formData.due_at,
        recurrence: formData.recurrence === "none" ? null : formData.recurrence
      }
      await updateTask(task.id, dataToSave)
      onOpenChange(false)
    } catch (error) {
      alert("Ошибка обновления")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Добавили max-h-[90vh] и flex flex-col, чтобы диалог не улетал за экран.
        overflow-y-auto позволяет скроллить саму модалку.
      */}
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4 py-4 flex-1">
          
          <div className="space-y-2">
            <Label>Название</Label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>

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

          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea 
              placeholder="Добавьте детали..."
              // Изменили resize-none на vertical и ограничили высоту, 
              // чтобы поле не раздувало модалку до бесконечности
              className="min-h-[100px] max-h-[200px] overflow-y-auto"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <DialogFooter className="sticky bottom-0 bg-white pt-4 flex flex-col sm:flex-row items-center gap-3">
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Нажмите <kbd className="font-sans border rounded px-1 bg-slate-50">Ctrl</kbd> + <kbd className="font-sans border rounded px-1 bg-slate-50">Enter</kbd>
            </p>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}