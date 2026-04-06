# Design System Specification: The Editorial Authority

## 1. Overview & Creative North Star
The visual language of this design system is rooted in the concept of **"The Editorial Authority."** Unlike generic "drag-and-drop" builders that feel like toy boxes, this system treats the resume-building process as a high-end publishing experience. 

We are bridging the gap between the intellectual precision of LaTeX and the fluid responsiveness of modern SaaS. The design breaks the "template" look through intentional asymmetry, massive typographic contrast, and a "paper-on-slate" layering philosophy. We prioritize white space as a functional tool, not a void, creating a digital workspace that feels like a quiet, high-end studio.

## 2. Colors
Our palette moves away from vibrant "tech" blues into the realm of architectural slates and deep charcoals.

*   **Primary & Tertiary (#000000):** Used for maximum contrast in typography and high-priority CTAs. It represents the "ink" on the page.
*   **The Deep Core (`primary_container`: #111c2d):** Used for structural sidebars or persistent navigation to provide a grounded, sophisticated anchor to the UI.
*   **The "No-Line" Rule:** Explicitly prohibit the use of 1px solid borders to define sections. Layout boundaries must be defined solely through background shifts. For example, an input area using `surface_container_low` (#f2f4f6) sitting atop a `background` (#f7f9fb) creates a clear but sophisticated boundary without "trapping" the content in a box.
*   **The Glass & Gradient Rule:** For floating elements like AI chat bubbles or "Quick Action" menus, use glassmorphism. Combine `surface_container_lowest` (#ffffff) at 80% opacity with a `backdrop-blur` of 12px. Main CTAs should utilize a subtle linear gradient from `primary` (#000000) to `primary_container` (#111c2d) at a 135-degree angle to add depth and "soul" to the click action.

## 3. Typography
The typographic soul of this design system lies in the tension between the intellectual `notoSerif` and the utilitarian `inter`.

*   **Display & Headlines (`notoSerif`):** These tokens mimic the authoritative weight of academic journals and high-end broadsheets. Use `display-lg` for hero welcome states and `headline-sm` for section headers within the resume.
*   **UI & Metadata (`inter`):** Used for all functional elements. The clean, neutral nature of Inter ensures that the UI "recedes" while the user's content (the Serif text) "advances."
*   **Hierarchy Note:** Always pair a `headline-sm` (Serif) with a `label-md` (Sans-serif, Uppercase) to create a sophisticated, editorial "Tag and Title" relationship.

## 4. Elevation & Depth
In this system, depth is a matter of "Tonal Layering" rather than physical drop shadows.

*   **The Layering Principle:** Treat the UI as a stack of fine paper. 
    *   **Level 0:** `background` (#f7f9fb) - The desk.
    *   **Level 1:** `surface_container_low` (#f2f4f6) - The workspace.
    *   **Level 2:** `surface_container_lowest` (#ffffff) - The document/card.
*   **Ambient Shadows:** If an element must float (e.g., a modal), use a shadow tinted with `on_surface` (#191c1e).
    *   *Spec:* `0px 12px 32px rgba(25, 28, 30, 0.06)`. It should feel like a soft glow of light, not a dark stain.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a border, use `outline_variant` (#c6c6cd) at 20% opacity. This provides a "hint" of a boundary without breaking the editorial flow.

## 5. Components

### Buttons
*   **Primary:** `primary` (#000000) background with `on_primary` (#ffffff) text. Use `DEFAULT` (0.25rem) rounding for a sharp, architectural feel.
*   **Secondary:** `secondary_container` (#d0e1fb) background. Use this for "Save" or "Preview" actions that are important but not the primary path.
*   **Tertiary:** No background. `primary` text with an underline that appears only on hover.

### Input Fields
Forbid the "four-sided box" look. 
*   **Style:** Use `surface_container_high` (#e6e8ea) as a subtle background fill with a 2px bottom stroke using `outline` (#76777d). 
*   **Focus State:** The bottom stroke transitions to `primary` (#000000) and the background shifts to `surface_container_highest` (#e0e3e5).

### Chat Interface (AI Resume Assistant)
*   **Container:** Use the Glassmorphism rule. `surface_container_lowest` at 85% opacity.
*   **Messages:** 
    *   **User:** `primary_container` (#111c2d) with `on_primary` text.
    *   **AI:** `surface_container` (#eceef0) with `on_surface` text.
*   **Spacing:** Use `spacing-3` (0.75rem) for internal message padding to keep the conversation tight and professional.

### Cards & Lists
*   **Constraint:** Zero dividers. 
*   **Implementation:** Separate list items using `spacing-4` (1rem) of vertical white space. If items need distinct grouping, use a subtle background shift to `surface_container_low` on hover.

### The "Paper" Preview
The resume itself should always sit on `surface_container_lowest` (#ffffff) to mimic high-quality bond paper, regardless of the surrounding UI theme.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. A wide left column for content and a narrow right column for "Tips" or "AI Insights" creates a premium, non-template feel.
*   **Do** leverage `notoSerif` for any text the user is *writing* and `inter` for any text the system is *showing*.
*   **Do** use `spacing-12` and `spacing-16` for section margins. Breathing room is the hallmark of luxury design.

### Don't
*   **Don't** use 100% opaque borders. They are too "heavy" for this system.
*   **Don't** use standard "Success Green" or "Warning Orange" unless absolutely necessary for errors. Prefer using `on_surface_variant` for subtle states to maintain the sophisticated palette.
*   **Don't** over-round corners. Stick to `DEFAULT` (0.25rem) or `sm` (0.125rem). The only exception is `full` (9999px) for status chips.