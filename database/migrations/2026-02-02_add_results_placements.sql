-- Migration: Add new placement values to banners_clean
-- Date: 2026-02-02
-- Purpose: Allow results page banner types in banners_clean table
-- Execute in: Supabase Dashboard → SQL Editor

-- Agregar nuevos valores al ENUM de placement
ALTER TYPE banner_placement ADD VALUE IF NOT EXISTS 'results_lateral';
ALTER TYPE banner_placement ADD VALUE IF NOT EXISTS 'results_intercalated';
ALTER TYPE banner_placement ADD VALUE IF NOT EXISTS 'results_below_filter';

-- Verificar
SELECT unnest(enum_range(NULL::banner_placement)) AS placement_values;
