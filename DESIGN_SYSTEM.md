# RAMS VINYL PORTFOLIO - DESIGN SYSTEM v2.0

## 1. Core Philosophy: "Apple Editorial"

**"Object Permanence meets Editorial Rigor"**

We combine the physical tactility of vinyl records (object permanence, physics, lighting) with the strict, grid-based layout of high-end editorial magazines (Monocle, Kinfolk).

- **The Mix:** Content is **Serif** (Human, Story). UI is **Sans-Serif** (System, Function).
- **The Grid:** All spacing is a multiple of **4px**.
- **The Feel:** Dense but legible. High contrast. No "gray on gray" for body text.

---

## 2. Typography System

We use a "Dual Typeface" system to separate _Story_ from _System_.

### Primary Typeface (Content): **ChillDuanHeiSong**

_Used for: Headings, Body Text, Quotes. A modern hybrid typeface._

| Role        | Size (Mobile/Desk) | Weight           | Leading | Tracking | Color     | Usage                             |
| :---------- | :----------------- | :--------------- | :------ | :------- | :-------- | :-------------------------------- |
| **Display** | 48px / 80px        | Bold (900)       | 0.9     | -0.04em  | `#111`    | Album Titles                      |
| **H1**      | 32px / 48px        | Bold (700)       | 1.0     | -0.02em  | `#111`    | Page Titles                       |
| **Body**    | 16px / 18px        | Regular (400)    | 1.6     | 0        | `#1A1A1A` | Main reading text. **Never #666** |
| **Quote**   | 20px / 24px        | ExtraLight (300) | 1.4     | 0        | `#1A1A1A` | Blockquotes                       |

### Secondary Typeface (System): **Helvetica Neue**

_Used for: Labels, Metadata, Navigation, Captions_

| Role       | Size | Weight       | Case    | Tracking | Color  | Usage                        |
| :--------- | :--- | :----------- | :------ | :------- | :----- | :--------------------------- |
| **Label**  | 10px | Bold (700)   | UPPER   | 0.2em    | `#888` | Section Headers (TECH STACK) |
| **Meta**   | 11px | Medium (500) | Regular | 0.05em   | `#666` | Dates, File sizes            |
| **Button** | 12px | Bold (700)   | UPPER   | 0.1em    | `#FFF` | Interactions                 |

---

## 3. Spacing System (The 4px Grid)

Strict adherence is required.

- **XS (4px):** Tight component grouping (icon + text).
- **S (8px):** Within a component.
- **M (16px):** Standard separation.
- **L (24px):** Section divider (Article paragraphs).
- **XL (40px):** Major Section break.
- **2XL (64px+):** Global clear space.

---

## 4. Color System

### Base

- **Canvas:** `#F3F3F1` (Warm White / Gallery Plaster)
- **Ink:** `#111111` (Off-Black) - For primary text.
- **Divider:** `#E5E5E5` - Subtle structural lines.

### Functional Roles

- **Structure:** `#000000` (10% opacity) - Shadows, texture.
- **Interaction:** `#000000` (40% opacity) - Hint text, secondary icons.

### Album Themes (The "Emotional Frequency")

Each album has a distinct "Frequency" that dictates its visual identity.

| Album       | ID            | Hex       | Name               | Rationale                                                    |
| :---------- | :------------ | :-------- | :----------------- | :----------------------------------------------------------- |
| **Intro**   | `WHO AM I`    | `#FFFFFF` | **Pure White**     | The canvas, the beginning, the void.                         |
| **Coding**  | `Vibe.Code`   | `#002FA7` | **Klein Blue**     | Deep, electric, spiritual, infinite. The color of pure code. |
| **Video**   | `Cinematics`  | `#F05A28` | **Kodak Orange**   | Warm, chemical, distinctive. The color of film packaging.    |
| **Photo**   | `Exposures`   | `#00C2CB` | **Chemical Cyan**  | The "Stop Bath" chemical in darkrooms. Sharp, acidic.        |
| **Writing** | `Think Piece` | `#1A1A1A` | **Matte Charcoal** | The color of ink on paper. Serious, heavy, permanent.        |

---

## 5. Motion & Physics (The "Turntable Logic")

**"It's not animation, it's mechanism."**

We do not simply "fade in". We simulate mechanical resistance and physical inertia.

- **Belt Drive (Scrolling):**
  - High Mass (`mass: 1`)
  - Low Stiffness (`stiffness: 50`)
  - _Feeling:_ Heavy, luxurious, momentum-based. Like a high-end Hi-Fi turntable.

- **Direct Drive (Interaction):**
  - Low Mass (`mass: 0.2`)
  - High Stiffness (`stiffness: 800`)
  - _Feeling:_ Instant, snappy, 1:1 response. Like a DJ scratch turntable.

- **The "Needle Drop":**
  - Interactions should feel like a needle dropping into a groove—precise, tactile, and irreversible.

---

## 5. Implementation Rules (The "Editor's Check")

1.  **Hierarchy Check:** Can you tell the difference between a "Section Header" and "Body Text" from 3 meters away?
    - _If slightly unsure:_ Make the Header **SMALLER** (10px) and **WIDER** (tracking). Make the Body **DARKER** (#111).
2.  **No orphans:** Text max-width should be controlled (approx 65 chars).
3.  **Vertical Rhythm:** Every element must sit on the rhythm. No arbitrary `mt-[13px]`.
4.  **Contrast:** Body text opacity must never be below 90% (#222). Only metadata gets to be gray.

---

## 6. Materials & Surfaces

**"Honesty of Materials"**

We do not fake texture. We do not use digital noise to simulate paper, nor do we use scratches to simulate age.

- **Surfaces:** Are pure, solid, and mathematically perfect.
- **Depth:** Is achieved through **Light** (Shadows) and **Layering** (Z-Index), not texture maps.
- **The Vinyl:** Is the _only_ skeuomorphic object allowed. It is a "Holy Object" and follows its own physical rules. Everything else is strict, flat, Swiss Design.
- **Colors:** Are chosen for their emotional frequency. They are never "washed out". If we need a gray, we pick a _specific_ gray (e.g., Cool Gray 3), not just `#ccc`.
