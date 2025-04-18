DAWS Chatbot Style Guide
This style guide defines the visual and interaction patterns for the DAWS website chatbot, ensuring it feels like a first‑class citizen on the client's site.

1. Color Palette

Name	Usage	Hex
DAWS Grey	Background panels, bubbles	#7D7D7D
Charcoal	Primary text, buttons (dark)	#333333
White	Chat window, text on dark BG	#FFFFFF
Black Accent	Primary buttons, icons, headers	#000000
Soft Light	Secondary backgrounds, hover	#F5F5F5
css
Copy
Edit
:root {
  --da- grey: #7D7D7D;
  --da-charcoal: #333333;
  --da-black: #000000;
  --da-white: #FFFFFF;
  --da-light: #F5F5F5;
}
2. Typography
Font Family
font-family: "Montserrat", sans-serif;
(Matches the site's clean geometric look.)

Heading (Chatbot Name / Titles)

css
Copy
Edit
.chatbot__header {
  font-size: 1rem;       /* 16px */
  font-weight: 600;      /* Semi‑bold */
  text-transform: uppercase;
  color: var(--da-black);
}
Body Text

css
Copy
Edit
.chatbot__message {
  font-size: 0.875rem;   /* 14px */
  font-weight: 400;      /* Normal */
  line-height: 1.4;
  color: var(--da-charcoal);
}
Input Placeholder

css
Copy
Edit
.chatbot__input::placeholder {
  color: var(--da-grey);
  opacity: 1;
}
3. Layout & Spacing
Widget Dimensions

Desktop width: max-width: 360px;

Mobile width: 100% of viewport (minimized margins)

Padding & Margins

Container padding: 16px

Message bubble spacing: 8px vertical margin

Button margin: 12px 0

css
Copy
Edit
.chatbot {
  padding: 16px;
}
.chatbot__message {
  margin: 8px 0;
}
.chatbot__button {
  margin: 12px 0;
}
4. Chat Bubbles

Bubble Type	Background	Text Color	Border Radius
Bot	var(--da-light)	var(--da-charcoal)	16px 16px 16px 4px
User	var(--da-grey)	var(--da-white)	16px 16px 4px 16px
css
Copy
Edit
.chatbot__bubble--bot {
  background: var(--da-light);
  color: var(--da-charcoal);
  border-radius: 16px 16px 16px 4px;
  padding: 12px;
}
.chatbot__bubble--user {
  background: var(--da-grey);
  color: var(--da-white);
  border-radius: 16px 16px 4px 16px;
  padding: 12px;
}
5. Buttons & Controls
Primary Button
Background: var(--da-black)

Text: var(--da-white)

Border radius: 999px (pill)

Padding: 8px 20px

Hover:

background: var(--da-charcoal);

css
Copy
Edit
.chatbot__button--primary {
  background: var(--da-black);
  color: var(--da-white);
  border: none;
  border-radius: 999px;
  padding: 8px 20px;
  font-weight: 500;
  cursor: pointer;
}
.chatbot__button--primary:hover {
  background: var(--da-charcoal);
}
Secondary Button
Background: transparent

Text: var(--da-black)

Border: 1px solid var(--da-black)

Border radius: 999px

Padding: 8px 20px

css
Copy
Edit
.chatbot__button--secondary {
  background: transparent;
  color: var(--da-black);
  border: 1px solid var(--da-black);
  border-radius: 999px;
  padding: 8px 20px;
  font-weight: 500;
  cursor: pointer;
}
.chatbot__button--secondary:hover {
  background: var(--da-light);
}
6. Icons & Controls
Icon Style:
Simple line icons or minimal glyphs in var(--da-black) or var(--da-white) for action buttons (close, minimize).

Size: 20px × 20px

Interactive Touch Area: 40px × 40px (for accessibility)

css
Copy
Edit
.chatbot__icon {
  width: 20px;
  height: 20px;
  padding: 10px;
  cursor: pointer;
}
7. Shadows & Depth
Widget Shadow:

css
Copy
Edit
.chatbot {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
Bubble Elevation (optional):

css
Copy
Edit
.chatbot__bubble--bot, .chatbot__bubble--user {
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
8. Animations & Transitions
Fade‑in chat widget: opacity 0 → 1 over 200ms

Button & bubble hover: background-color 150ms ease

css
Copy
Edit
.chatbot {
  opacity: 0;
  animation: fadeIn 200ms ease-out forwards;
}
@keyframes fadeIn {
  to { opacity: 1; }
}
.chatbot__button,
.chatbot__bubble {
  transition: background-color 150ms ease;
}
9. Accessibility
Contrast: All text meets at least WCAG AA contrast ratio (4.5:1).

Focus States:

css
Copy
Edit
.chatbot__button:focus {
  outline: 2px dashed var(--da-black);
  outline-offset: 2px;
}
ARIA Roles:

role="dialog" on the widget

aria-live="polite" for incoming bot messages

Putting It All Together
Embed your chatbot widget with these CSS variables and classes to seamlessly blend with DAWS's existing look and feel. By following this guide you'll ensure:

Brand consistency through color and typography

Readability & accessibility for all users

A polished, professional UI that matches the rest of the DAWS website

