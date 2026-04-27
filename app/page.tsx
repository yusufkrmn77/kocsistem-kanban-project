"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Layout } from 'lucide-react';

const COLUMNS = ["YAPILACAKLAR", "DEVAM EDENLER", "BİTENLER"];

function SortableItem({ id, title }: { id: string; title: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all touch-none"
    >
      <p className="text-sm font-semibold text-slate-700">{title}</p>
    </div>
  );
}

export default function KanbanBoard() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Staj projesini başlat', status: 'YAPILACAKLAR' },
    { id: '2', title: 'Dnd-kit kütüphanesini öğren', status: 'DEVAM EDENLER' },
    { id: '3', title: 'Arayüzü güzelleştir', status: 'BİTENLER' },
  ]);

  useEffect(() => { setMounted(true); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addNewTask = (column: string) => {
    const title = prompt("Yeni görev başlığı:");
    if (!title) return;
    setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), title, status: column }]);
  };

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Eğer bir kartın üzerine değil de, direkt sütun alanının üzerine geldiysek:
    const isOverAColumn = COLUMNS.includes(overId);
    
    if (isOverAColumn && activeTask.status !== overId) {
      setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: overId } : t)));
      return;
    }

    // Eğer başka bir kartın üzerine geldiysek:
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: overTask.status } : t)));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setTasks((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  }

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Layout size={24} /></div>
          <h1 className="text-2xl font-bold text-slate-900">TaskFlow Pro</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragOver={handleDragOver} 
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map((col) => (
              <div key={col} id={col} className="bg-slate-200/60 p-4 rounded-2xl border border-slate-300 min-h-[500px] flex flex-col">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">{col}</h2>
                
                {/* Sütun ID'sini buraya bağladık ki sürükleme alanı genişlesin */}
                <SortableContext items={tasks.filter(t => t.status === col).map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 flex flex-col">
                    {tasks.filter(t => t.status === col).map(t => <SortableItem key={t.id} id={t.id} title={t.title} />)}
                    {/* Boş alana bırakmayı kolaylaştırmak için görünmez bir alan */}
                    <div className="flex-1 min-h-[100px]" />
                  </div>
                </SortableContext>

                <button onClick={() => addNewTask(col)} className="mt-4 flex items-center justify-center gap-2 py-3 w-full text-xs font-bold text-slate-600 bg-white/50 hover:bg-white rounded-xl border border-slate-300 transition-all">
                  <Plus size={14} /> GÖREV EKLE
                </button>
              </div>
            ))}
          </DndContext>
        </div>
      </div>
    </main>
  );
}