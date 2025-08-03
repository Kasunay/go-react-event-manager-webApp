import React from 'react';
import { Music, Trophy, Palette, Presentation, Utensils, BookOpen, Tent, Moon } from 'lucide-react'; // Adjust the import path as needed

export const categoryIcons: Record<string, React.ReactNode> = {
  music: React.createElement(Music, { className: "h-8 w-8" }),
  sports: React.createElement(Trophy, { className: "h-8 w-8" }),
  arts: React.createElement(Palette, { className: "h-8 w-8" }),
  conferences: React.createElement(Presentation, { className: "h-8 w-8" }),
  food: React.createElement(Utensils, { className: "h-8 w-8" }),
  workshops: React.createElement(BookOpen, { className: "h-8 w-8" }),
  festivals: React.createElement(Tent, { className: "h-8 w-8" }),
  nightlife: React.createElement(Moon, { className: "h-8 w-8" }),
}