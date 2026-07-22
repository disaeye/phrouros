# Phrouros UI

## Design Read
Phrouros (φρουρός, “sentinel”) is a local agent monitoring dashboard for developers — OpenCode + oh-my-openagent aware. Apple HIG light language (Activity Monitor + Settings hybrid).

## Tokens (light / dark)
Aligned to Apple HIG ops UI — neutral canvas, one blue accent, status colors only for state.

| Token | Light | Dark | Role |
|---|---|---|---|
| bg | `#f5f5f7` | `#000000` | page canvas |
| surface | `#ffffff` | `#1c1c1e` | cards |
| surface-2 | `#f0f0f3` | `#2c2c2e` | nested panels |
| ink | `#1d1d1f` | `#f5f5f7` | primary text |
| muted | `#6e6e73` | `#a1a1a6` | labels |
| faint | `#8e8e93` | `#8e8e93` | tertiary |
| blue | `#0071e3` | `#0a84ff` | action / completed |
| green | `#34c759` | `#30d158` | running / success |
| orange | `#ff9f0a` | `#ff9f0a` | idle / warning |
| red | `#ff3b30` | `#ff453a` | error |
| violet | `#af52de` | `#bf5af2` | cost / special |
| cyan | `#32ade6` | `#64d2ff` | secondary role |
| icon | `#3a3a3c` | `#d1d1d6` | default glyph |

- radius: 12–16px
- font: SF Pro / system Chinese stack
- density: medium

## Icons
- **Lucide geometry** (official path data): clean, geometric, not freehand
- Stroke-only; default 2px, identity glyphs ~2.2–2.25
- Never fade icons with low opacity — use `--icon-color` instead
- **Borderless identity glyphs** (no plates / discs / frames):
  - Agent = tone-colored stroke glyph + name
  - Category = tone-colored stroke glyph + lowercase label
- Prefer SF Symbols–style toolbar: icon-only controls with `title` / `aria-label`

## Toolbar (HIG)
- Refresh / language / theme / auto-refresh / live = icon-only
- Language: 文 / A segmented control
- Theme: sun / moon
- Labels only in accessibility tooltips

## Layout
1. Sticky chrome: topbar (title + project select + refresh/lang/theme/auto) + status strip (main / plan / bg / cost)
2. Project overview KPI grid (data-driven, 12 cards, click → relevant tile)
3. Waterfall timeline
4. Two-column on desktop: OMO plan | Main agent
5. Background agents cards
6. Work breakdown tabs (plan → todos → delegates)
7. Model cost table (composition + totals row)
8. Collapsible import

## Project KPI cards (decision order)
Not a usage vanity wall. Cards answer developer questions in order:
1. Plan progress — where am I?
2. Working now — is anything still running?
3. Steps left — what remains on the plan?
4. Open todos — operational backlog
5. Run cost / tokens / cache hit — cost of THIS main-session tree
6. Run duration — how long has this been going?

Usage totals are scoped to: current main session + direct child sessions (not project lifetime, not calendar day).

## Agent identity
Each agent role has a fixed SVG silhouette + tone (not emoji):
- Sisyphus → boulder / blue
- Atlas → globe / cyan
- Prometheus → flame / orange
- Metis → scale / violet
- Momus → shield / green
- Oracle → eye / violet
- Explore → search / cyan
- Librarian → book / blue
- Junior → wrench / green
- Hephaestus → hammer / orange
- Looker → eye / orange
- Unknown → bot / blue

`agentChip(name)` used wherever an agent name appears (main, bg, waterfall, delegates, drawer).
