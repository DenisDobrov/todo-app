'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTask } from "@/app/dashboard/actions"
import { Label } from "@/components/ui/label"

export function EditTaskDialog({ task, projects, open, onOpenChange }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    due_at: task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : "",
    project_id: task.project_id,
    priority: task.priority
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateTask(task.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("Ошибка при обновлении");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Описание (Текст)</Label>
            <Textarea 
              placeholder="Добавьте детали задачи..."
              className="min-h-[120px] resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Дедлайн</Label>
              <Input 
                type="datetime-local" 
                value={formData.due_at}
                onChange={(e) => setFormData({...formData, due_at: e.target.value})}
              />
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

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}