'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- KART BİLEŞENİ ---
function SortableItem({ id, content, onEdit, onDelete }: any) {
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
      className="bg-white p-4 mb-3 rounded-lg shadow-sm border border-gray-200 group relative"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mb-2">
        <div className="w-8 h-1 bg-gray-200 rounded-full mb-1"></div>
        <p className="text-gray-800 font-medium">{content}</p>
      </div>
      
      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(id)}
          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
        >
          Düzenle
        </button>
        <button 
          onClick={() => onDelete(id)}
          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
        >
          Sil
        </button>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState<any>({
    todo: { title: 'Yapılacaklar', items: [] },
    doing: { title: 'Devam Edenler', items: [] },
    done: { title: 'Bitenler', items: [] },
  });

  // 1. ADIM: Hafızadan Veri Yükleme
  useEffect(() => {
    const savedUser = localStorage.getItem('kanban-user');
    const savedData = localStorage.getItem('kanban-data');
    if (savedUser) setUserName(savedUser);
    if (savedData) setColumns(JSON.parse(savedData));
  }, []);

  // 2. ADIM: Verileri Kaydetme
  useEffect(() => {
    localStorage.setItem('kanban-data', JSON.stringify(columns));
  }, [columns]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = (e.currentTarget.elements[0] as HTMLInputElement).value;
    if (name) {
      setUserName(name);
      localStorage.setItem('kanban-user', name);
    }
  };

  const addItem = (colId: string) => {
    const content = prompt('Görev nedir?');
    if (!content) return;
    
    const newItem = { id: Math.random().toString(), content };
    setColumns({
      ...columns,
      [colId]: { ...columns[colId], items: [...columns[colId].items, newItem] }
    });
  };

  const editItem = (itemId: string) => {
    const newContent = prompt('Görevi düzenle:');
    if (!newContent) return;

    const newColumns = { ...columns };
    for (const colId in newColumns) {
      newColumns[colId].items = newColumns[colId].items.map((item: any) => 
        item.id === itemId ? { ...item, content: newContent } : item
      );
    }
    setColumns(newColumns);
  };

  const deleteItem = (itemId: string) => {
    if (!confirm('Silmek istediğine emin misin?')) return;
    const newColumns = { ...columns };
    for (const colId in newColumns) {
      newColumns[colId].items = newColumns[colId].items.filter((item: any) => item.id !== itemId);
    }
    setColumns(newColumns);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event: any) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCol = Object.keys(columns).find(key => columns[key].items.find((i: any) => i.id === activeId));
    const overCol = Object.keys(columns).find(key => key === overId || columns[key].items.find((i: any) => i.id === overId));

    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev: any) => {
      const activeItems = [...prev[activeCol].items];
      const overItems = [...prev[overCol].items];
      const activeIndex = activeItems.findIndex(i => i.id === activeId);
      const item = activeItems[activeIndex];

      activeItems.splice(activeIndex, 1);
      overItems.push(item);

      return {
        ...prev,
        [activeCol]: { ...prev[activeCol], items: activeItems },
        [overCol]: { ...prev[overCol], items: overItems },
      };
    });
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const activeCol = Object.keys(columns).find(key => columns[key].items.find((i: any) => i.id === active.id));
      if (!activeCol) return;

      const oldIndex = columns[activeCol].items.findIndex((i: any) => i.id === active.id);
      const newIndex = columns[activeCol].items.findIndex((i: any) => i.id === over.id);

      setColumns((prev: any) => ({
        ...prev,
        [activeCol]: {
          ...prev[activeCol],
          items: arrayMove(prev[activeCol].items, oldIndex, newIndex),
        },
      }));
    }
    setActiveId(null);
  }

  // --- GİRİŞ EKRANI ---
  if (!userName) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-blue-100 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-6">KoçSistem Kanban</h1>
          <p className="text-gray-500 mb-8">Lütfen devam etmek için isminizi girin.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Adınız Soyadınız" 
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Projeye Başla
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ANA KANBAN EKRANI ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Proje Panosu</h1>
            <p className="text-slate-500">Hoş geldin, {userName}</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="text-sm text-red-500 hover:underline"
          >
            Çıkış Yap
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {Object.keys(columns).map((colId) => (
              <div key={colId} className="bg-slate-100 rounded-xl p-4 min-h-[500px] flex flex-col border border-slate-200">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">
                    {columns[colId].title} ({columns[colId].items.length})
                  </h2>
                  <button 
                    onClick={() => addItem(colId)}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm hover:shadow-md transition-all font-bold"
                  >
                    +
                  </button>
                </div>

                <SortableContext items={columns[colId].items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-grow">
                    {columns[colId].items.map((item: any) => (
                      <SortableItem 
                        key={item.id} 
                        id={item.id} 
                        content={item.content} 
                        onEdit={editItem}
                        onDelete={deleteItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </DndContext>
        </div>
      </div>
    </div>
  );
}