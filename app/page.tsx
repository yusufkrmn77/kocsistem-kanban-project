'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
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
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 100 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 mb-3 rounded-xl shadow-sm border border-slate-200 group relative">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="w-8 h-1 bg-slate-100 rounded-full mb-2"></div>
        <p className="text-slate-700 font-bold text-sm">{content}</p>
      </div>
      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(id)} className="text-[10px] font-black text-blue-600 uppercase">Düzenle</button>
        <button onClick={() => onDelete(id)} className="text-[10px] font-black text-red-600 uppercase">Sil</button>
      </div>
    </div>
  );
}

// --- SÜTUN BİLEŞENİ (Droppable alan için) ---
function Column({ id, title, items, onAdd, onEdit, onDelete }: any) {
  const { setNodeRef } = useSortable({ id }); // Sütunu da droppable yapıyoruz

  return (
    <div ref={setNodeRef} className="bg-slate-200/50 rounded-[2rem] p-6 min-h-[550px] border border-white flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-xs uppercase tracking-widest text-slate-500">{title}</h2>
        <button onClick={() => onAdd(id)} className="w-8 h-8 bg-white rounded-xl shadow-sm text-blue-600 font-black hover:scale-110 transition-transform">+</button>
      </div>
      <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-grow">
          {items.map((item: any) => (
            <SortableItem key={item.id} id={item.id} content={item.content} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [columns, setColumns] = useState<any>({
    todo: { title: 'Yapılacaklar', items: [] },
    doing: { title: 'Devam Edenler', items: [] },
    done: { title: 'Bitenler', items: [] },
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('kanban-user');
    const savedData = localStorage.getItem('kanban-data');
    if (savedUser) setUserName(savedUser);
    if (savedData) setColumns(JSON.parse(savedData));
  }, []);

  useEffect(() => {
    localStorage.setItem('kanban-data', JSON.stringify(columns));
  }, [columns]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCol = Object.keys(columns).find(key => columns[key].items.find((i: any) => i.id === activeId));
    let overCol = Object.keys(columns).find(key => columns[key].items.find((i: any) => i.id === overId)) || overId;

    if (!activeCol || !columns[overCol]) return;

    if (activeCol !== overCol) {
      setColumns((prev: any) => {
        const activeItems = [...prev[activeCol].items];
        const overItems = [...prev[overCol].items];
        const activeIndex = activeItems.findIndex(i => i.id === activeId);
        const [movedItem] = activeItems.splice(activeIndex, 1);
        overItems.push(movedItem);
        return { ...prev, [activeCol]: { ...prev[activeCol], items: activeItems }, [overCol]: { ...prev[overCol], items: overItems } };
      });
    } else {
      const oldIndex = columns[activeCol].items.findIndex((i: any) => i.id === activeId);
      const newIndex = columns[activeCol].items.findIndex((i: any) => i.id === overId);
      if (oldIndex !== newIndex && newIndex !== -1) {
        setColumns((prev: any) => ({
          ...prev,
          [activeCol]: { ...prev[activeCol], items: arrayMove(prev[activeCol].items, oldIndex, newIndex) }
        }));
      }
    }
  };

  if (!userName) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-sm w-full text-center">
          <h1 className="text-3xl font-black text-slate-800 mb-6">TaskFlow</h1>
          <form onSubmit={(e: any) => { e.preventDefault(); const n = e.target.name.value; if(n){setUserName(n); localStorage.setItem('kanban-user', n);}}}>
            <input name="name" type="text" placeholder="İsminizi Yazın" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none border-2 border-transparent focus:border-blue-500 text-slate-800 font-bold" required />
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100">Başla</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16">
      <div className="max-w-6xl mx-auto flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">PANOM.</h1>
          <p className="text-slate-400 font-bold text-xs uppercase mt-2">{userName}</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[10px] font-black text-red-400 uppercase tracking-widest">Çıkış Yap</button>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {Object.keys(columns).map(colId => (
            <Column 
              key={colId} 
              id={colId} 
              title={columns[colId].title} 
              items={columns[colId].items} 
              onAdd={(id: string) => { const c = prompt('Görev?'); if(c) setColumns({...columns, [id]: {...columns[id], items: [...columns[id].items, {id: Math.random().toString(), content: c}]}})}}
              onEdit={(itemId: string) => { const c = prompt('Düzenle:'); if(c) { const n = {...columns}; for(let k in n) n[k].items = n[k].items.map((i:any) => i.id === itemId ? {...i, content: c} : i); setColumns(n); }}}
              onDelete={(itemId: string) => { if(confirm('Sil?')) { const n = {...columns}; for(let k in n) n[k].items = n[k].items.filter((i:any) => i.id !== itemId); setColumns(n); }}}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}