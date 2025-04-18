# Project Tasks & Progress

## Core Chatbot Functionality

-   [x] **Setup OpenAI Assistant:** Created Assistant, stored ID securely.
-   [x] **Backend API:** Implemented `chat-handler` Supabase Edge Function to manage conversations with OpenAI.
-   [x] **Frontend Widget:** Created `ChatWidget.tsx`, integrated into dashboard, handles message sending/receiving, loading/errors.
-   [x] **Basic Conversation Flow:** Implemented initial greeting message logic.
-   [x] **Conditional Email Capture:** Implemented pre-chat email form based on settings.
-   [x] **Settings Context:** Created `SettingsContext` to manage widget settings (`requireEmailFirst`).
-   [x] **Database Logging:**
    -   [x] Created `conversations`, `messages`, `leads` tables.
    -   [x] Added `metadata` column to `messages` (fixed schema cache issue).
    -   [x] Added `channel`, `start_url`, etc. to `conversations` & `status` to `leads`.
    -   [x] `chat-handler` logs user/assistant messages to `messages` table.
    -   [x] `chat-handler` creates entries in `conversations` table.
-   [x] **Lead Capture (Function Calling):**
    -   [x] Defined `capture_lead` function schema for Assistant.
    -   [x] Updated `chat-handler` to handle `capture_lead` tool call and insert into `leads` table.
-   [x] **Hosted Deployment:**
    -   [x] Migrated to hosted Supabase project.
    *   [x] Configured `.env` and `secrets.env` correctly.
    *   [x] Deployed `chat-handler` function and set secrets.
    *   [x] Debugged and resolved database insert issues (schema cache, missing column).

## Settings Page UI/UX

-   [x] **ChatbotSettings Component:** Created component for configuring appearance and behavior.
-   [x] **Basic Settings:** Implemented saving/loading for theme color, position, initial message, lead collection timing (to `localStorage` via Context).
-   [x] **Assistant Configuration Display:**
    -   [x] Created `manage-assistant` backend function to fetch Assistant details.
    -   [x] Display Assistant instructions (read-only initially).
    -   [x] Display associated files (for File Search) with status and filename.
    -   [x] Fixed file ID retrieval logic.
-   [x] **Assistant Instructions Editing:**
    -   [x] Implemented backend logic in `manage-assistant` to update instructions (POST method).
    -   [x] Added frontend UI (Dialog) to edit and save instructions.
    -   [x] **Fixed by removing a logic error in the component where the Dialog was conditionally rendered with `!isDialogOpen` in the condition, preventing it from showing.**
    -   [x] **Also fixed a related linter error with `vector_store_file_id` property.**
-   [x] **Layout Improvements:**
    -   [x] Implemented 2-column grid layout for Appearance and Behavior sections.
    -   [x] Wrapped sections in bordered containers for better visual separation.
-   [x] **Color Picker:** Added basic native color picker input alongside hex input.

## Current Debugging Task

-   [x] **Fix Settings Dialog:** Investigate why the "Edit Instructions" Dialog is not appearing visually, even though state (`isDialogOpen`) seems to be updating correctly. Check DOM rendering, CSS conflicts, component integrity.
    - Fixed by removing a logic error in the component where the Dialog was conditionally rendered with `!isDialogOpen` in the condition, preventing it from showing.
    - Also fixed a related linter error with `vector_store_file_id` property.

## Settings Page Improvements

-   [x] **Fix Settings Persistence:**
    -   [x] Replace mock implementation of `fetchChatbotSettings` and `saveChatbotSettings` with proper localStorage storage in new `settings-service.ts`
    -   [x] Update Settings.tsx to use real localStorage-based data instead of mock service
    -   [x] Add loading/saving states with proper UI feedback for all save actions
    -   [x] Ensure settings like theme color, position, etc. persist across page refreshes

-   [x] **Improve Save Button Functionality:**
    -   [x] Update "Save Appearance & Behavior" button with loading state
    -   [x] Enhance "Edit Instructions" dialog's save button with loading state
    -   [x] Add proper error handling with toast notifications
    -   [x] Ensure "Require email before chat" toggle persists in SettingsContext via localStorage

-   [x] **Connect ChatWidget to Saved Settings:**
    -   [x] Update ChatWidget to load settings from localStorage using `settings-service.ts`
    -   [x] Apply theme color to header, buttons, and message bubbles 
    -   [x] Use saved initial message instead of hardcoded value
    -   [x] Add loading state while settings are being fetched

## Remaining / Next Steps (Based on Suggestions)

*(Items from User Suggestions - Prioritization Needed)*

-   [ ] **UI/UX Enhancements (Settings Page):**
    -   [ ] Implement Live Preview Panel for chatbot settings.
    -   [ ] Implement Enhanced Color Picker (widget with presets).
    -   [ ] Implement Group & Collapse Sections (Accordion for Appearance, Behavior, Config).
    -   [ ] Add Tooltips & Help Text (for individual settings).
    -   [ ] Implement Smarter Inputs (numeric stepper, toggle labels, consider rich text editor for instructions).
    -   [ ] Add Sticky Actions Bar (Save/Revert buttons always visible).
    -   [ ] Enhance Inline Validation & Feedback (beyond basic react-hook-form).
    -   [ ] Review/Improve Responsive & Keyboard Accessibility.
-   [ ] **File Management (Settings Page):**
    -   [ ] Implement Search & Filter for associated files list.
    -   [ ] Implement Drag-and-drop file upload to Vector Store.
    -   [ ] Implement file deletion (Remove) from Vector Store.
    -   [ ] Implement bulk actions for files.
-   [ ] **Chat Widget Enhancements:**
    -   [ ] Implement proactive triggers (time on page, etc.).
    -   [ ] Persist chat session across page refreshes (localStorage/sessionStorage).
-   [ ] **Backend / Data Enhancements:**
    -   [ ] Implement GeoIP lookup in `chat-handler`.
    -   [x] Link conversations/leads to `auth.users` if applicable.
        - [x] Added `user_id` column to `conversations` and `leads` tables via migration.
        - [x] Update `chat-handler` to save `user_id` when creating conversations/leads.
        - [x] Update frontend (`ChatWidget.tsx`) to send `userId` to `chat-handler`.
    -   [ ] Implement detailed Conversations page view (message previews, etc.).
        - [x] Update `Conversation` type in `src/types/index.ts`.
        - [x] Fetch and display `channel` and `start_url` in `Conversations.tsx`.
        - [ ] Display message count / last message preview.
        - [x] Implement navigation to detailed conversation view.
        - [x] Add RLS policy for message SELECT.
        - [x] Create `ConversationDetail.tsx` page component.
        - [x] Add route for `/conversations/:id`.
        - [x] Make rows clickable in `Conversations.tsx`.
    -   [ ] **CRM Integration:** Implement sending lead data to a CRM.
-   [ ] **Testing:** Thoroughly test lead capture, conversation flows, UI variations.

## Lead Management UI

-   [x] **Lead Management UI:** Build UI features in Settings/Leads page to update lead `status`.
    -   [x] Update `Lead` type in `src/types/index.ts`.
    -   [x] Update `Leads.tsx` to fetch real data from Supabase.
    -   [x] Update `LeadsTable.tsx` to display status column and add Select dropdown.
    -   [x] Implement status update logic in `LeadsTable.tsx` using Supabase update.
    -   [x] Implement `onLeadUpdate` callback in `Leads.tsx` to update local state.
    -   [x] Add RLS policy to allow users to update their own leads.

## Future Improvements / Ideas (Based on Design Doc & Screenshot)

**Chat Widget Visual Redesign (Match Screenshot & Style Guide):**

*   [x] **Container:** Set width (360px implemented as w-96/384px), box-shadow (`shadow-xl`).
*   [x] **Header:**
    *   [x] Implement title: "How can we help you today? 👋"
    *   [x] Implement minimize/close controls (functional & styled).
    *   [x] Apply styling (padding, background color `#F5F5F5`, text color `#333333`).
*   [x] **Color Scheme & Typography:**
    *   [x] Define and apply brand colors (`#7D7D7D`, `#333333`, `#000000`, `#FFFFFF`, `#F5F5F5`) via CSS variables.
    *   [x] Apply Montserrat font family (via global import).
*   [x] **Message Bubbles:**
    *   [x] Style Bot Bubble (BG: `#F5F5F5`, text: `#333`, specific border-radius `rounded-lg`, padding `p-3`).
    *   [x] Style User Bubble (BG: `#7D7D7D`, text: `#FFF`, specific border-radius `rounded-lg`, padding `p-3`).
*   [x] **Buttons:**
    *   [x] Style Primary Button (BG: `#000`, text: `#FFF`, pill shape `rounded-full`, padding, hover).
    *   [x] Style Secondary Button (border `#000`, text: `#000`, pill shape `rounded-full`, padding, hover).
*   [ ] **Animations:** Implement fade-in widget, hover transitions, typing indicator (typing indicator exists).

**Chat Widget Functional Enhancements (Based on Design Doc):**

*   [x] **Widget States:**
    *   [x] Implement Minimized state (floating icon).
    *   [x] Implement Expanded state (full panel).
    *   [ ] Ensure responsive behavior (full-width mobile).
*   [x] **Initial View Quick Actions:**
    *   [x] Display initial view with "Arrange a Callback" (Primary) and "Enquire More About Our Products" (Secondary) buttons instead of immediate chat input.
    *   [x] Hide chat history/input initially. (Clarification: Shows initial message, hides standard input)
*   [x] **Guided Flow - Arrange a Callback:**
    *   [x] Trigger flow from quick action button.
    *   [x] Prompt for name, phone, enquiry, date.
    *   [x] Implement Date/Time picker component.
    *   [x] Display confirmation message.
    *   [x] *(Backend)* Define/implement backend scheduling endpoint.
*   [x] **Guided Flow - Enquire More About Products:**
    *   [x] Trigger flow from quick action button.
    *   [x] Implement category selection buttons.
    *   [x] Implement sub-category selection buttons.
    *   [x] Implement resource choice buttons (Simplified to 'View Product Page' and 'Ask About Product').
    *   [x] Deliver resource link in chat message (for link types - Product Page).
    *   [x] Improve resource link handling (open in new tab) and button text.
    *   [x] ~~Handle lead capture resource types (Contact Sales, Request Sample).~~ (Removed as part of simplification).
    *   [x] *(Backend)* Define/implement product-info service/lookup (Placeholder structure defined & simplified).
*   [x] **Free-Text & FAQ Handling:**
    *   [x] Transition from Quick Actions/Guided Flows to free-text input.
        *   [x] Added "Ask a question" button to initial view.
        *   [x] Transition callback flow completion to FREE_CHAT mode.
    *   [ ] Ensure OpenAI Assistant uses provided PDFs for technical lookups (verify Assistant setup).
    *   [ ] Implement fallback message ("I'm not sure...") with options (speak to specialist, help center).
*   [ ] **Lead Capture Integration:**
    *   [ ] Trigger lead capture form (name/email/phone) after N messages or specific CTA.
    *   [ ] Integrate inline form into chat flow.
*   [ ] **Bottom Navigation (Optional):**
    *   [ ] Add "Home" button (resets conversation).
    *   [ ] Add "Contact" button (opens lead form/email link).
*   [x] **Persist Conversation State:**
    *   [x] Save/Retrieve OpenAI `thread_id` to/from `localStorage`.
        *   [x] Implement saving `thread_id` to `localStorage` in `ChatWidget.tsx`.
        *   [x] Implement retrieving `thread_id` from `localStorage` on widget load.

*(Existing Tasks moved/merged where applicable)*

## Backend / Data Enhancements

*   [x] **Database Setup & Migrations:**
    *   [x] Created `conversations`, `messages`, `leads` tables.
    *   [x] Added `metadata` column to `messages`.
    *   [x] Added `channel`, `start_url`, `ip_address`, `user_agent` to `conversations` & `status` to `leads`.
    *   [x] Added `user_id` column to `conversations` and `leads` tables.
    *   [x] Added/Fixed RLS policies for `conversations` and `leads` (SELECT, UPDATE).
    *   [x] Fixed idempotency issues in migration files (triggers, policies).
*   [ ] **GeoIP Lookup:** Implement GeoIP lookup in `chat-handler` based on client IP to enrich `conversations` data.
*   [ ] **Link User Accounts:** (Note: This is for dashboard users, not anonymous widget users)
    *   [x] Added `user_id` columns to DB.
    *   [x] Updated `chat-handler` (though `userId` will be null for anon users).
    *   [x] Implemented dashboard login flow (`AuthContext`, `App.tsx`).
*   [ ] **Detailed Conversations View:** Enhance Conversations page.
    *   [x] Update `Conversation` type in `src/types/index.ts`.
    *   [x] Fetch and display `channel` and `start_url` in `Conversations.tsx`.
    *   [ ] Display message count / last message preview.
    *   [x] Implement navigation to detailed conversation view.
        *   [x] Add RLS policy for message SELECT.
        *   [x] Create `ConversationDetail.tsx` page component.
        *   [x] Add route for `/conversations/:id`.
        *   [x] Make rows clickable in `Conversations.tsx`.
*   [ ] **CRM Integration:** Implement sending lead data to a CRM.

## Testing

*   [ ] **Testing:** Thoroughly test lead capture, conversation flows, UI variations, guided flows, RLS, login/anon interactions.

*(Deprecated/Old Tasks Removed or Merged)*

---

Project Brief: Website Chatbot Lead Generation Agent
1. Project Overview
Objective:
Develop a chatbot that integrates directly into the client's website to serve as a proactive lead generation tool. The chatbot will engage site visitors by answering questions, providing information about products and services, and capturing lead details. It will leverage the OpenAI Assistant API to ensure natural, contextually relevant interactions while maintaining robust tracking and analytics of user engagements.

Purpose:

Enhance User Engagement: Act as an on-demand assistant to help visitors navigate the website, answer frequently asked questions, and provide personalized interactions.

Drive Lead Capture: Initiate conversations that qualify visitors as prospective leads, capture contact information (e.g., name, email, phone), and route these leads to the client's CRM.

Enable Data-Driven Decisions: Track all interactions for valuable insights, informing the marketing and sales strategies of the client.

2. Objectives & Goals
Improve Conversion Rates: Increase the percentage of visitors who convert to leads by providing immediate, context-aware responses.

Track Engagement Accurately: Implement robust tracking features to monitor visitor interactions, gather data on conversation outcomes, and integrate with existing analytics and CRM systems.

Enhance User Experience: Provide swift and accurate responses to common queries, ensuring visitors find the information they need with minimal friction.

Facilitate Seamless Integration: Utilize the OpenAI Assistant API in a way that is seamless for integration into the current website architecture and existing marketing technology stack.

3. Scope
Integration Scope:

Front-end integration on key website pages (homepage, product pages, FAQ section).

Back-end connectivity to the client's CRM or lead management systems for real-time lead capture.

Feature Scope:

Natural language processing using the OpenAI Assistant API.

Customizable conversation flows (e.g., greetings, FAQs, lead qualification).

Logging and analytics of user interactions.

Proactive conversation triggers based on visitor behavior (e.g., time on page, repeated visits).

Fallback mechanisms to connect with a human representative if needed.

4. Functional Requirements
Conversation Management:

Initiate conversations with visitors based on pre-defined triggers (e.g., after a certain dwell time or upon visiting product pages).

Understand and respond to a variety of visitor queries using dynamic, context-aware responses.

Incorporate both scripted responses (for FAQs) and adaptive responses via the OpenAI API for more nuanced queries.

Lead Capture & Qualifying:

Prompt visitors for basic contact information (name, email, phone number) during the conversation.

Include qualification questions (e.g., "What are you looking for today?" or "How soon do you plan to make a decision?").

Store lead information securely and transmit it to the client's CRM system via API or webhook integration.

Tracking & Analytics:

Track engagement metrics such as session duration, conversion rates, interaction paths, and drop-off points.

Record detailed logs of each conversation for analysis and reporting.

Integrate with third-party analytics tools (Google Analytics, Mixpanel, etc.) for enhanced insights.

User Interface & Experience:

Provide a responsive, intuitive chat interface that aligns with the client's branding.

Ensure mobile and desktop compatibility.

Offer an easy-to-access "escalate to human agent" option during the conversation.

Security & Compliance:

Ensure end-to-end encryption for all user data.

Comply with applicable data protection regulations (such as GDPR or CCPA) for storing personal information.

Maintain audit trails for lead data and interaction histories.

5. Technical Requirements
API Integration:

Utilize the OpenAI Assistant API for processing natural language inputs and generating responses.

Implement secure API connections and manage API key rotations responsibly.

Front-End Integration:

Embed the chatbot widget into the website's codebase using JavaScript and/or relevant web technologies.

Optimize for load times and minimal resource usage, ensuring a smooth user experience.

Back-End Systems:

Build or extend an existing lead management system to receive and store data captured via the chatbot.

Implement webhooks or API endpoints to allow seamless transfer of lead information to external systems (CRM, email marketing platforms, etc.).

Analytics & Logging:

Use logging frameworks to capture detailed session data.

Develop a dashboard to visualize key metrics (number of interactions, lead conversion rate, average conversation duration, etc.).

Scalability & Reliability:

Design the system to handle variable traffic loads.

Implement error handling and fallback mechanisms to ensure continuous operation even if third-party APIs experience outages.

8. Use Cases
Use Case 1: Visitor Engagement & FAQs
Primary Actor: Website Visitor

Description:
A visitor lands on the website and is automatically greeted by the chatbot. The chatbot asks if the visitor needs help and offers to answer frequently asked questions. The user can ask for information about services, pricing, or product details.

Outcomes:
The visitor receives immediate, accurate responses, leading to increased satisfaction and higher likelihood of engaging further with the site.

Use Case 2: Lead Capture & Qualification
Primary Actor: Prospective Customer

Description:
During the conversation, the chatbot recognizes intent to learn more about the offerings. It then prompts the visitor to provide their contact details in exchange for tailored information or a free consultation. Follow-up qualification questions (e.g., timeframe, budget) help determine lead quality.

Outcomes:
The chatbot captures essential lead information and qualifies the visitor, automatically feeding the data into the client's CRM for sales follow-up.

Use Case 3: Personalized Product or Service Guidance
Primary Actor: User Seeking Guidance

Description:
The visitor inquires about which product or service might be best suited for their needs. The chatbot uses a guided questionnaire style to understand the visitor's requirements and then offers tailored recommendations with explanations.

Outcomes:
The lead receives personalized product/service advice, enhancing engagement, driving interest, and increasing the likelihood of conversion.

Use Case 4: Escalation to Human Agent
Primary Actor: Visitor with Complex Queries

Description:
If the chatbot detects that a visitor's inquiry is beyond its programmed knowledge or if the user requests human assistance, the system either escalates the conversation in real time (e.g., triggers a notification to a human agent) or seamlessly provides a contact option for further support.

Outcomes:
Ensures no visitor feels unsupported, thereby reducing bounce rates and enhancing customer service by providing a smooth transition to human support.

Use Case 5: Engagement Analytics & Reporting
Primary Actor: Marketing/Sales Team

Description:
The client needs to review data on chatbot interactions and lead conversion metrics. The back-end system collects and logs user interactions, which are then visualized on a custom dashboard.

Outcomes:
Stakeholders can monitor performance, analyze user behavior, and adjust marketing strategies based on concrete data.

9. Success Metrics
Lead Conversion Rate: Percentage of interactions converting to valid leads.

Engagement Rate: Number of chats initiated vs. total website visitors.

User Satisfaction: Feedback scores and post-interaction surveys.

Response Accuracy: Rate of correctly answered queries based on predefined FAQs.

Operational Uptime: Maintaining a high level of system availability and responsiveness.

10. Action Plan

1.  **Setup OpenAI Assistant:**
    *   Create an OpenAI Assistant specifically for this chatbot.
    *   Define its initial instructions, model, and enable necessary tools (like function calling if needed later for CRM integration).
    *   Store the Assistant ID securely (e.g., environment variables). - **Done (Set Supabase secrets for OpenAI keys)**
2.  **Backend Development (API Route/Server):** - **Done (Implemented using Supabase Edge Function `chat-handler`. Cleaned up old Express code.)**
    *   ~~Create a backend endpoint (e.g., using Node.js/Express or a serverless function) to handle communication between the frontend chatbot and the OpenAI Assistant API.~~
    *   ~~This endpoint will:~~ // (Handled by Edge Function)
        *   ~~Receive messages from the frontend.~~
        *   ~~Manage OpenAI threads (create new ones or retrieve existing ones).~~
        *   ~~Add user messages to the thread.~~
        *   ~~Run the Assistant on the thread.~~
        *   ~~Handle potential function calls if implemented.~~
        *   ~~Stream or send back the Assistant's response to the frontend.~~
        *   ~~Manage API keys securely.~~
3.  **Frontend Chat Widget Development:** - **In Progress**
    *   Choose or build a chat UI component (potentially using libraries like `shadcn/ui`). - **Done (Created `ChatWidget.tsx`)**
    *   Integrate the chat widget into the target website pages (`index.html`, likely using a framework within `src/`). - **Done (Integrated into `DashboardLayout.tsx`)**
    *   Implement logic to:
        *   Send user messages to the backend endpoint. - **Done (Using `supabase.functions.invoke`)**
        *   Receive and display Assistant responses. - **Done**
        *   Handle loading states and errors. - **Done (Basic handling added)**
        *   Implement proactive triggers (e.g., based on time on page).
        *   **Add initial greeting message (`Hi there! 👋 How can I help you today?`).** - **Done (Added logic in `ChatWidget.tsx`)**
        *   **Implement conditional email capture before chat starts (based on a flag).** - **Done (Added logic and state in `ChatWidget.tsx`)**
    *   UI/UX Polish: Improving the look and feel of the chat widget. - **In Progress**
    *   **Connect 'Require email before chat' toggle on settings page to ChatWidget behavior.** - **Done**
        *   Created `SettingsContext`. - **Done**
        *   Wrapped **App component (`src/App.tsx`)** in `SettingsProvider`. - **Done**
        *   Updated `ChatbotSettings.tsx` to use context for the toggle. - **Done**
        *   Updated `ChatWidget.tsx` to use context for conditional email form. - **Done**
4.  **Conversation Flow & Logic:**
    *   Refine the Assistant's instructions to guide conversations towards lead generation goals.
    *   Implement specific logic for FAQs (using OpenAI knowledge retrieval or hardcoded responses).
    *   Handle lead capture prompts within the conversation flow.
    *   **Configure Chat Widget for initial greeting message.** - **Done**
    *   **Configure Chat Widget for optional pre-chat email capture.** - **Done**
5.  **CRM Integration:**
    *   Determine the client's CRM and its API capabilities.
    *   Implement a mechanism (e.g., OpenAI function calling or backend logic) to send captured lead data to the CRM.
6.  **Tracking & Analytics:**
    *   Backend: Log conversation details. - **Done (Basic logging to `conversations` & `messages` tables implemented, citation handling added)**
        *   **Note:** Need to re-run `npx supabase db reset` locally as the `metadata` column addition failed previously.
    *   Frontend: Integrate with analytics tools (e.g., Google Analytics) to track widget interactions.
    *   Consider creating a simple dashboard or reporting mechanism.
7.  **Security & Compliance:**
    *   Ensure HTTPS and data protection compliance (GDPR/CCPA).
    *   Securely manage API keys and credentials.
8.  **Testing:**
    *   Test conversation flows, CRM integration, UI/UX, and error handling.
    *   **Test Lead Capture via Function Calling.** - **Pending Deployment & Testing**
9.  **Deployment:**
    *   Deploy backend and frontend components.
10. **Monitoring & Maintenance:**
    *   Monitor API usage, costs, uptime, and performance.
    *   Periodically review logs and analytics for refinement.

---

### Completed / Ongoing Tasks

*   **Branding Update:** Replaced instances of "LeadSpark" with "DawsBot" in UI components (`DashboardLayout`, `Dashboard` page). - **Done**
*   **Conversations Page:** Connected to Supabase `conversations` table (displays ID, Start Time, Visitor Email). Removed mock data. - **Done (Basic)**
*   [x] **Lead Capture (Function Calling):** - **In Progress**
    *   Created `leads`

- Read `src/services/settings-service.ts` to understand how `widgetSettings` (including `themeColor`) are loaded.
  - Identified that settings are loaded from `localStorage` (`chatbot_settings` key) and the default `themeColor` is `#10b981`.
  - Conclusion: Initial thought was `localStorage` value was white, but user confirmed it was red.
  - **Correction:** Realized the code was incorrectly using `hsl()` wrapper around the hex color value from settings when applying background color via inline styles.
  - **Fix:** Modified `ChatWidget.tsx` to use a CSS variable (`--theme-color`) set by the hex value from settings and apply it directly via `style={{ backgroundColor: 'var(--theme-color)' }}` to the header and minimized button. Added `as React.CSSProperties` to resolve TS errors.

- [ ] Implement Lead Capture Buttons (`lead_capture_contact`, `lead_capture_sample`)
  - [x] Add new conversation modes (`LEAD_CAPTURE_CONTACT_FORM`, `LEAD_CAPTURE_SAMPLE_FORM`)
  - [x] Add state variables for form inputs (name, email, phone, address)
  - [x] Update `handleResourceSelect` to transition to new modes
  - [x] Add JSX for lead capture forms in `renderChatInterface`
  - [x] Implement `handleLeadSubmit` function to validate, log event, and send lead details to backend assistant
  - [ ] Test lead capture flow and verify backend tool (`capture_lead`) interaction

## Content Finalization

- [x] Replace placeholder URLs in `productInfo` (Removed Brochure links as requested)
- [ ] Finalize all text content (prompts, button labels, assistant instructions).

## Dashboard Enhancements

-   [x] **UI/UX Enhancements:**
    -   [x] Add Leads per Day (Last 7 Days) Bar Chart below KPI cards.
    -   [x] Remove Tabs from dashboard page.
    -   [x] Surface "Recent Leads" list directly on dashboard page below chart.
    -   [x] Add "Recent Conversations" list (similar to Recent Leads).
    -   [x] Enhanced Dashboard Structure:
        -   [x] Added Conversion Rate and Average Conversation Duration as key metrics.
        -   [x] Implemented dual-metric chart showing both Leads and Conversations over time.
        -   [x] Added Regional Distribution pie chart showing visitor country data.
        -   [x] Improved layout with responsive grids for better information density.
        -   [x] Added more detailed data to conversation items (country location, status indicators).
    -   [x] Fixed routing issue by updating App.tsx to use Dashboard.tsx instead of DashboardHome.tsx.
    -   [x] Removed redundant DashboardHome.tsx component.
    -   [ ] Add Quick Actions/Links (e.g., Configure Settings, View Full Analytics).