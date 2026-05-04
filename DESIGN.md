# Design

## Theme
A balanced, high-performance aesthetic that shifts between **Light** (for daytime booking) and **Dark** (for professional management at night).

**Scene**: A customer quickly booking a field on their phone while at the gym (high light, high contrast needed). An owner reviewing revenue on a desktop in a dimly lit office (low light, low eye strain needed).

## Colors
Using **OKLCH** for all values.

### Core Palette
- **Primary (Action)**: `oklch(60% 0.25 250)` (Vibrant Sport Blue) - Used for primary actions, selections, and energy.
- **Secondary (Accent)**: `oklch(70% 0.25 50)` (Energetic Orange) - Used for highlights, active status, and "hot" time slots.
- **Surface (Light)**: `oklch(98% 0.01 250)` (Cool Tinted White)
- **Surface (Dark)**: `oklch(15% 0.02 250)` (Deep Obsidian)

### Neutral Scale
- Tinted toward the brand blue (`chroma 0.01`).

## Typography
- **Primary Font**: `Outfit` (Headings) - Geometric, energetic.
- **Secondary Font**: `Inter` (Body) - Highly legible, professional.
- **Scale**: Minor Third (1.200).

## Layout & Rhythm
- **Base Grid**: 4px / 8px system.
- **Containers**: Max-width 1280px for desktop. Fluid for mobile.
- **Radius**: `12px` for main cards/buttons (modern-soft).

## Motion
- **Curves**: `cubic-bezier(0.4, 0, 0.2, 1)` (Quartic Ease-out).
- **Duration**: `200ms` for micro-interactions, `400ms` for page transitions.

## Components
- **Buttons**: Pill-shaped or soft-square with subtle 3D hover effects.
- **Inputs**: Clean, outlined with high-contrast active states.
- **Status Badges**: Soft background tints with bold text.
