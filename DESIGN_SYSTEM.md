# RAMS VINYL PORTFOLIO - DESIGN SYSTEM

## 1. Core Philosophy

**"Less but Better" meets "Analog Tactility"**

- **Reductionism:** Remove non-essential elements. Use whitespace (negative space) as an active layout component.
- **Physicality:** Although digital, elements must behave like physical objects. Cards have thickness (rim lighting), weight (spring physics), and occlusion (shadows).
- **Abstraction:** Imagery should not be literal. Use color fields, gradients, and textures to evoke mood rather than represent objects.

## 2. Color System (The "Four Pillars")

### Base

- **Canvas:** `#F3F3F1` (Warm White / Gallery Plaster) - Never pure white.
- **Ink:** `#111111` (Off-Black) - For primary text.

### Thematic Accents

Strict adherence to these colors for their respective categories. Album covers must be abstract representations of these hues.

| Category    | Name                | Hex       | Vibe / Meaning                                 |
| :---------- | :------------------ | :-------- | :--------------------------------------------- |
| **Writing** | **Ink / Charcoal**  | `#1A1A1A` | Deep, Monochromatic, Texture of paper and ink. |
| **Coding**  | **Klein Blue**      | `#002FA7` | Electric, Precision, Digital, Pure Logic.      |
| **Video**   | **Film Orange**     | `#F05A28` | Kinetic, Warmth, Light Leaks, Motion Blur.     |
| **Photo**   | **Developing Cyan** | `#00C2CB` | Chemical, Glass, Cool Observation, Ethereal.   |
| **Intro**   | **Pure White**      | `#FFFFFF` | Clean, Minimalist, Open, Tabula Rasa.          |

## 3. Typography

**Typeface:** EarlySummerSerif (Fallback: Helvetica Neue, Arial, Sans-serif) - a Serif font to bring a literary feel

- **Headings:** Uppercase, Bold/Black weight. Tracking (letter-spacing) is tight (`-0.03em`) for large headers, wide (`0.1em`) for small labels.
- **Metadata:** Monospace or small caps.
- **Sizing:** Scale is dramatic. Contrast between huge titles and tiny metadata is key.

## 4. Materials & Texture

- **Vinyl Record:** Glossy, Anisotropic reflection (conic gradient), Micro-grooves texture.
- **Sleeves:** Matte cardboard finish. Needs specific "Rim Light" (`ring-1 ring-white/20`) to show edge thickness.
- **Atmosphere:** Global CSS noise overlay (`mix-blend-mode: multiply`, `opacity: 0.08`) to unify all colors with a film grain look. _Exception: Immersive View left panel uses a clean, solid surface to highlight physical objects._

## 5. Motion & Physics (Framer Motion)

- **Stacking:** No transparency on covers. Use `Z-Index` and `Brightness` masking to create depth.
- **Springs:** Stiffness `150`, Damping `20`, Mass `0.8`. Snappy but weighted.
- **Interaction:**
  - **Active:** Scale 1.1, Shadow `0 40px 80px rgba(0,0,0,0.5)`, No grayscale.
  - **Inactive:** Scale < 1.0, Grayscale `0.5`, Brightness `0.4`, Overlay Black `40%`.

## 6. Implementation Rules

1. **No Ghosting:** Always use solid backgrounds on cards. Never `opacity < 1` for the main container of a card in a 3D stack.
2. **Clipping Fix:** Increase X-axis spacing and Z-axis depth significantly to prevent 3D clipping artifacts.
3. **Imagery:** Do not use complex photos. Use abstract textures, gradients, or geometric forms that match the color pillar.
