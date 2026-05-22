import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ActionType } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TASK_META: Record<ActionType, {
  label: string
  bg: string
  border: string
  text: string
  dot: string
  icon: string
}> = {
  SOWING:     { label: 'Sembrar',     bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500',  icon: '🌱' },
  TRANSPLANT: { label: 'Trasplantar', bg: 'bg-violet-50',   border: 'border-violet-300',  text: 'text-violet-800',  dot: 'bg-violet-500',   icon: '🪴' },
  WATER:      { label: 'Regar',       bg: 'bg-sky-50',      border: 'border-sky-300',     text: 'text-sky-800',     dot: 'bg-sky-500',      icon: '💧' },
  FERTILIZE:  { label: 'Abonar',      bg: 'bg-amber-50',    border: 'border-amber-300',   text: 'text-amber-800',   dot: 'bg-amber-500',    icon: '🌿' },
  HARVEST:    { label: 'Cosechar',    bg: 'bg-orange-50',   border: 'border-orange-300',  text: 'text-orange-800',  dot: 'bg-orange-500',   icon: '🌾' },
  CHECK:      { label: 'Revisar',     bg: 'bg-stone-50',    border: 'border-stone-300',   text: 'text-stone-700',   dot: 'bg-stone-400',    icon: '🔍' },
}

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  verdura: { label: 'Verdura',    color: 'bg-emerald-100 text-emerald-800' },
  fruta:   { label: 'Fruta',      color: 'bg-orange-100 text-orange-800' },
  hierba:  { label: 'Hierba',     color: 'bg-lime-100 text-lime-800' },
  legumbre:{ label: 'Legumbre',   color: 'bg-yellow-100 text-yellow-800' },
  cereal:  { label: 'Cereal',     color: 'bg-amber-100 text-amber-800' },
}

export const STATUS_META = {
  active:    { label: 'Activa',    color: 'bg-emerald-100 text-emerald-800' },
  harvested: { label: 'Cosechada', color: 'bg-orange-100 text-orange-800' },
  removed:   { label: 'Retirada',  color: 'bg-stone-100 text-stone-600' },
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', ...opts
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short'
  })
}

export function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function cycleProgress(sowingDate: string, daysToHarvest: number): number {
  const sow = new Date(sowingDate + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const elapsed = Math.max(0, (today.getTime() - sow.getTime()) / 86400000)
  return Math.min(100, Math.round((elapsed / daysToHarvest) * 100))
}
