---
name: Nexus Terminal System
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff817a'
  on-tertiary-container: '#7e000f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  title-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  mono-metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.02em
  mono-metric-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
  mono-metric-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  margin: 0.75rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

The design system establishes a high-performance institutional grade terminal interface engineered for quantitative traders, portfolio managers, and institutional analysts. The aesthetic is rigorous, technical, and precision-driven, merging the utilitarian density of legacy Bloomberg systems with the sleek, modern rendering capabilities of high-frequency visual platforms like TradingView.

The emotional tone balances absolute analytical command, unwavering reliability, and visual ergonomics during sustained market exposure. Every pixel serves an operational purpose: maximum information throughput with minimal cognitive friction. The design movement blends **high-contrast analytical modernism** with **tactile density**—relying on razor-thin grid borders, strict alignment, monospace numeric readouts, and vivid status-driven indicators suspended over midnight blue and deep slate foundations.

## Colors

The palette is engineered specifically for prolonged screen sessions and rapid visual telemetry. Surfaces use deep, low-luminance slate and navy tones to minimize optical fatigue, while high-saturation accents highlight transactional risk, price action, and active state transitions.

- **Primary Canvas & Base:** `#0b0f19` (Canvas baseline), `#111827` (Panel surface container), and `#1e293b` (Elevated surfaces, card headers, and interactive tab rails).
- **Primary Accent (`#06b6d4` - Cyan / Electric Blue):** Applied to telemetry focus, active indicators, chart trend overlays, selection crosshairs, and live system signals.
- **Directional Secondary (`#10b981` - Emerald Green):** Denotes positive yield, bid volume weight, long position entries, profit realization, and bull runs.
- **Directional Tertiary (`#ef4444` - Crimson / Rose):** Reserved for ask volume weight, negative yield, short positions, liquidations, and critical risk thresholds.
- **Structural Outlines:** `#1e293b` and translucent slate `#334155/40` provide crisp separation between dense data modules without visual clutter.
- **Light Theme Support:** When toggled to light mode, surfaces invert to crisp technical off-white and cool gray canvases (`#f8fafc`, `#ffffff`, `#e2e8f0`) with dark slate typography (`#0f172a`), retaining the exact semantic emerald, crimson, and cyan tokens for financial continuity.

## Typography

Typography is governed by tabular legibility, functional hierarchy, and visual compactness.

1. **Space Grotesk (Display & Major Headers):** Offers geometric sharpness and tech-forward character for primary layout titles, module titles, and platform branding.
2. **Inter (Interface & Neutral Copy):** Handles contextual menus, descriptions, table row descriptions, and tooltips with optimal subpixel rendering at small sizes.
3. **JetBrains Mono (Numerical Telemetry & Order Books):** Mandatory for all prices, volumes, spreads, P&L calculations, timestamps, and order book depths. Monospaced tabular alignment guarantees numbers do not jitter or shift layout during rapid live market streaming.

All secondary labels and column keys employ `label-caps` in uppercase format with micro letter-spacing to enhance readability in compact table headers.

## Layout & Spacing

The terminal is structured around an ultra-dense, multi-pane modular dashboard layout optimized for ultra-wide, multi-monitor, and high-DPI desktop setups, while gracefully reflowing on smaller viewports.

- **Desktop Framework:** A continuous CSS Grid / Docking layout leveraging fine 1px dividers. Panes can be rearranged, expanded, or tabbed into sub-workspaces. Outer page margins are intentionally restrained to `0.75rem` (`12px`) and module gutters to `0.5rem` (`8px`) to ensure screen real estate is overwhelmingly allocated to live charts, execution ladders, and data grids.
- **Component Density:** Internal padding uses compact steps (`space-xs` = 2px, `space-sm` = 4px, `space-md` = 8px) to preserve dense vertical and horizontal telemetry packing.
- **Responsive Reflow:**
  - *Ultra-wide / Desktop (>1440px):* Full 6-pane multi-column architecture featuring permanent side watchlists, central interactive charting panels, right-hand analytics/order books, and bottom news/alerts feeds.
  - *Tablet / Small Desktop (768px - 1439px):* Split 2-column or stacked view with collapsing drawer watchlists and tabbed switching between Order Book, Gauge Analytics, and Positions.
  - *Mobile (<767px):* Single-column full-width module layout with floating quick-switch bottom navigation and full-screen modal chart inspections.

## Elevation & Depth

Visual hierarchy within the design system avoids heavy drop shadows or skeuomorphic blurs, which introduce visual noise into rapid chart and metric evaluations. Depth is conveyed strictly through **tonal layering** and **crisp 1px borders**:

- **Layer 0 (Canvas Base):** Deepest void background (`#0b0f19`).
- **Layer 1 (Card & Module Surfaces):** Primary content containers (`#111827`) bounded by crisp, low-contrast 1px boundaries (`#1e293b`).
- **Layer 2 (Elevated Controls & Hover States):** Table header strips, inner sub-panels, and dropdown triggers (`#1e293b`) with faint border enhancements (`#334155`).
- **Layer 3 (Modals, Context Flyouts & Tooltips):** Floating dialogs (`#0f172a`) framed by an illuminated 1px border (`#06b6d4` at 40% opacity or `#334155`), reinforced with a minimal ambient shadow (`0 8px 24px rgba(0, 0, 0, 0.65)`).
- **Data Accents & Highlights:** Active chart crosshairs and selected tabs utilize subtle cyan glows (`0 0 12px rgba(6, 182, 212, 0.25)`) to direct immediate analytical focus.

## Shapes

The design system adopts a **Soft / Technical (`1`)** shape language. Tight curvature reinforces mathematical rigor and saves screen real estate:

- Standard cards, panels, button surfaces, and data input fields use `0.25rem` (`4px`) corner radii.
- Secondary elements, metric badges, and compact tags use micro-radii of `2px` or sharp terminal cuts to preserve high-density text packing.
- Tooltips, modal shells, and floating toasts leverage `0.5rem` (`8px`) rounding to distinguish structural system notifications from static dashboard tiles.
- Circular shapes are strictly reserved for status pings, asset iconography, and circular gauges/donuts.

## Components

### Buttons & Order Execution Controls
- **Buy / Sell Primary Actions:** Two-part asymmetric CTA triggers. The `BUY` action is filled with emerald green (`#10b981`), white uppercase text (`Space Grotesk`, bold), and zero drop-shadow; `SELL` utilizes crimson red (`#ef4444`). Active click triggers a micro-recessed transform (`scale(0.98)`).
- **Secondary / Ghost Buttons:** Flat slate borders (`#1e293b`), transparent fills, and cyan text hover states (`#06b6d4`).

### Data Tables & Order Books
- **Dense Row Heights:** Set to 22px to 28px max height. Numeric figures always right-align using `JetBrains Mono`.
- **Bid/Ask Depth Bars:** Backed by translucent horizontal bar charts embedded directly within the table cell (`rgba(16, 185, 129, 0.15)` for Bids, `rgba(239, 68, 68, 0.15)` for Asks).
- **Table Headers:** Capitalized `label-caps` typography, muted gray (`#64748b`), with instantaneous column sorting triggers.

### Chips & Status Indicators
- **Metric Badges:** Micro-sized inline badges indicating percentage changes (`+2.4%`, `-0.8%`). Green badges use `rgba(16, 185, 129, 0.12)` fill with solid `#10b981` text; red badges use `rgba(239, 68, 68, 0.12)` fill with solid `#ef4444` text.
- **Pill Toggles:** Pill filters for timeframe selection (`1M`, `5M`, `15M`, `1H`, `1D`) feature a solid cyan line bottom indicator or cyan background pill when active.

### Input Fields & Selectors
- **Numeric Order Inputs:** Dark background (`#0b0f19`), crisp border (`#1e293b`), accompanied by monospace values, inline increment/decrement steppers, and clear unit labels (`USD`, `LOT`, `%`). Focus ring displays a sharp 1px cyan outline (`#06b6d4`) without ambient glow.

### Cards, Charting Panes & Gauges
- **Modular Cards:** Every card features a standardized 32px header bar with a Space Grotesk module title, action icons (expand, settings, close), and a 1px border line separating it from the data viewport.
- **Portfolio Analytics & Risk Meters:** Semi-circular needle gauges featuring green-to-red gradients with bold centered risk labels ("Moderate", "Aggressive") and donut asset allocation charts with cyan, emerald, purple, and gold segment fills.
- **AI Forecasting & Candlestick Charts:** High-contrast multi-layer charts with glowing trend lines (cyan `#06b6d4` with dotted confidence boundaries) laid over transparent grid lines (`#1e293b`).