# Container Lifecycle Management - UI/UX Design Guide

**Status:** Design Phase (Components TBD)  
**Purpose:** Define visual design, interaction patterns, and user flows  
**Target Users:** Admins, Managers, Operators  

---

## **1. Status Badge Design**

### **Visual Hierarchy & Semantics**

Each status has distinct visual identity for quick recognition:

```
┌────────────┬──────────┬────────────┬──────────────┐
│ Status     │ Color    │ Style      │ Meaning      │
├────────────┼──────────┼────────────┼──────────────┤
│ DRAFT      │ Gray     │ Outlined   │ Incomplete   │
│ READY      │ Blue     │ Outlined   │ Waiting      │
│ ACTIVE     │ Green    │ Solid      │ In Use       │
│ CLOSED     │ Orange   │ Outlined   │ Done         │
│ ARCHIVED   │ Dark     │ Ghost      │ Inactive     │
└────────────┴──────────┴────────────┴──────────────┘
```

### **Design Rationale**

- **Solid badge** = Primary actionable state (ACTIVE)
- **Outlined badge** = Transitional states (DRAFT, READY, CLOSED)
- **Ghost badge** = Terminal state (ARCHIVED) - appears "faded"
- **Color psychology:**
  - Green = Active/running
  - Blue = Waiting/preparation
  - Orange = Caution/completed
  - Gray/Dark = Inactive/archived

### **Badge Styling Examples**

```
DRAFT (Gray Outline)
┌──────────────────┐
│ ◯ DRAFT          │  ← Circle icon for "plan" stage
└──────────────────┘

READY (Blue Outline)
┌──────────────────┐
│ ✓ READY          │  ← Checkmark indicates approval
└──────────────────┘

ACTIVE (Green Solid)
┌──────────────────┐
│ ● ACTIVE         │  ← Filled circle = "live"
└──────────────────┘

CLOSED (Orange Outline)
┌──────────────────┐
│ ⊘ CLOSED         │  ← Prohibition symbol
└──────────────────┘

ARCHIVED (Dark Ghost)
┌──────────────────┐
│ ⧉ ARCHIVED       │  ← Grayed out, de-emphasized
└──────────────────┘
```

---

## **2. Container Card UI Layout**

### **List/Grid View - Compact Card Design**

```
╔════════════════════════════════════════════╗
║  Warehouse-001                             ║
║  ◯ DRAFT                                   ║  ← Status badge (top right)
║                                            ║
║  Type: Warehouse  │  Created: 2 days ago  ║  ← Metadata
║                                            ║
║  [Activate]  [Archive]              [⋮]   ║  ← Actions (inline)
╚════════════════════════════════════════════╝
```

### **Detail View - Expanded Card Design**

```
╔═══════════════════════════════════════════════════╗
║  Warehouse-001                                    │
║  STATUS: ● ACTIVE                                │
║                                                   │
║  Basic Information                                │
║  ├─ Type: Warehouse                              │
║  ├─ Created: 2 days ago by Admin                 │
║  ├─ Modified: 30 mins ago                        │
║  └─ Organization: EMC                            │
║                                                   │
║  Relationships                                    │
║  ├─ Parent: None                                 │
║  ├─ Children: 3 attached                         │
║  │  ├─ ULD-001 (ACTIVE)                          │
║  │  ├─ ULD-002 (ACTIVE)                          │
║  │  └─ Item-003 (READY)                          │
║  └─ Assignments: Warehouse-North (Linked)        │
║                                                   │
║  Available Actions                               │
║  ├─ [Detach Child]  [Close Container]            │
║  ├─ [Archive]       [View History]               │
║  └─ [Edit Details]  [Permissions]                │
║                                                   │
╚═══════════════════════════════════════════════════╝
```

---

## **3. Action Button Placement Strategy**

### **Primary vs Secondary Actions**

**Rule:** Hide invalid actions, highlight primary action per status

```
DRAFT Container:
┌──────────────────────────────────┐
│ [Activate] ← PRIMARY (Bold)     │  ← Large, high contrast
│ [Archive]  ← SECONDARY           │  ← Normal weight
│ [⋮ More]   ← TERTIARY            │  ← Icon-only
└──────────────────────────────────┘

READY Container:
┌──────────────────────────────────┐
│ [Attach Child] ← PRIMARY         │
│ [Archive]                        │
│ [⋮ More]                         │
└──────────────────────────────────┘

ACTIVE Container:
┌──────────────────────────────────┐
│ [Detach]  [Close] ← PAIRED       │  ← Both primary
│ [Archive]                        │
│ [⋮ More]                         │
└──────────────────────────────────┘

CLOSED Container:
┌──────────────────────────────────┐
│ [Reopen] ← PRIMARY               │
│ [Archive]                        │
│ [⋮ More]                         │
└──────────────────────────────────┘

ARCHIVED Container:
┌──────────────────────────────────┐
│ (No actions available)           │  ← Read-only, grayed out
│ [View Only] [History]            │
└──────────────────────────────────┘
```

---

## **4. Workflow State Visualization**

### **Linear Progress Indicator**

Shows container's position in lifecycle:

```
DRAFT  →  READY  →  ACTIVE  →  CLOSED
  ◯      ◯        ●         ◯
       (Optional path to ARCHIVED at any point)
                         ↴
                      ARCHIVED
                         ⧉
```

### **for Active Container:**

```
DRAFT  →  READY  →  ACTIVE  ←  (YOU ARE HERE)  →  CLOSED
  ✓      ✓        ✓                              ◯
                                                  ↴
                                              ARCHIVED
```

### **for Archived Container:**

```
DRAFT  →  READY  →  ACTIVE  →  ARCHIVED (terminal)
  ✓      ✓        ✓           ✓
  
(No further transitions possible)
```

---

## **5. Parent-Child Relationship Visualization**

### **Hierarchy Display**

```
┌─ Warehouse-001 (ACTIVE) ─────────────────┐
│                                          │
│  Parents/Associates:                     │
│  └─ None (top-level container)          │
│                                          │
│  Children (3 attached):                  │
│  ├─ [✓] ULD-001 (Status: ACTIVE)        │
│  ├─ [✓] ULD-002 (Status: ACTIVE)        │
│  └─ [✓] Item-003 (Status: READY)        │
│                                          │
│  Actions Available:                      │
│  ├─ [Detach specific child]              │
│  ├─ [Close all (cascades to children)]   │
│  └─ [Archive all (cascades)]             │
│                                          │
└──────────────────────────────────────────┘
```

### **Tree View Alternative**

```
📦 Warehouse-001 (ACTIVE)
│
├── 📦 ULD-001 (ACTIVE)
│   ├── 📦 Item-A (READY)
│   └── 📦 Item-B (READY)
│
├── 📦 ULD-002 (ACTIVE)
│   └── 📦 Item-C (READY)
│
└── 📦 Item-003 (READY)
    └── [Expand for children...]
```

---

## **6. Action Confirmation Patterns**

### **Pattern A: Inline Confirmation (Low Risk)**

For low-risk actions like simple transitions:

```
Container: Warehouse-001
Status: DRAFT

[Activate to READY?]

[Cancel]  [Confirm]
```

### **Pattern B: Modal Confirmation (Medium Risk)**

For actions with side effects:

```
╔═════════════════════════════════════════╗
║  ⚠️  Close Container?                   ║
├─────────────────────────────────────────┤
║                                         ║
║  Container: Warehouse-001               ║
║  Current Status: ACTIVE                 ║
║                                         ║
║  ⚠️  Side Effects:                      ║
║  • 3 active child containers will       ║
║    also be CLOSED:                      ║
║    • ULD-001 (ACTIVE → CLOSED)         ║
║    • ULD-002 (ACTIVE → CLOSED)         ║
║    • Item-003 (READY → unchanged)      ║
║                                         ║
║  Reason for closing (optional):         ║
║  ┌────────────────────────────────┐    ║
║  │                                │    ║
║  └────────────────────────────────┘    ║
║                                         ║
║  [Cancel]  [Close Container]            ║
╚═════════════════════════════════════════╝
```

### **Pattern C: Step-by-Step Wizard (High Risk)**

For complex operations like bulk actions:

```
Step 1: Select Action
┌──────────────────────────┐
│ ⊙ Attach Child          │
│ ◯ Detach Child          │
│ ◯ Close Container       │
│ ◯ Archive               │
└──────────────────────────┘

Step 2: Review Details
┌──────────────────────────┐
│ Parent: Warehouse-001    │
│ Target Child: ULD-002    │
│ Effect: Parent READY→ACT │
└──────────────────────────┘

Step 3: Confirm
[Back]  [Done]
```

---

## **7. Status Change Notification UI**

### **Success Toast**

```
✓ Container Updated
  Warehouse-001 transitioned DRAFT → READY
  [Undo]  [Dismiss]
  
  Auto-dismisses in 5 seconds
```

### **Error Toast**

```
✗ Action Failed
  Cannot close READY container
  (Only ACTIVE containers can be closed)
  
  [Retry]  [Dismiss]
  
  Stays until dismissed
```

### **In-Progress Toast**

```
⟳ Processing...
  Archiving 5 containers recursively...
  
  [Cancel]
  
  Shows progress if >2 seconds
```

---

## **8. Timeline/Audit Log UI**

Shows container's lifecycle history:

```
╔═════════════════════════════════════════╗
║  Container History - Warehouse-001      ║
├─────────────────────────────────────────┤
║                                         ║
║  📌 [2:45 PM] Activated                 ║
║     DRAFT → READY                       ║
║     by: Admin User                      ║
║                                         ║
║  📍 [2:50 PM] Child Attached            ║
║     ULD-002 attached                    ║
║     Parent: READY → ACTIVE              ║
║     by: Manager User                    ║
║                                         ║
║  🔗 [3:10 PM] Second Child Attached     ║
║     ULD-003 attached                    ║
║     Parent: ACTIVE (unchanged)          ║
║     by: Manager User                    ║
║                                         ║
║  ⊘ [4:00 PM] Closed                     ║
║     ACTIVE → CLOSED                     ║
║     Cascaded: ULD-002, ULD-003 closed   ║
║     by: Admin User                      ║
║     Reason: "End of shift"              ║
║                                         ║
╚═════════════════════════════════════════╝
```

---

## **9. Search & Filter UI**

### **Filter Sidebar**

```
╔═══════════════════╗
║ Filters           ║
├───────────────────┤
║                   ║
║ Status:           ║
║ ☑ DRAFT           ║
║ ☑ READY           ║
║ ☑ ACTIVE          ║
║ ☐ CLOSED          ║
║ ☐ ARCHIVED        ║
║                   ║
║ Container Type:   ║
║ ☑ Warehouse       ║
║ ☑ ULD             ║
║ ☐ Item            ║
║                   ║
║ Created By:       ║
║ [Search user...]  ║
║                   ║
║ [Clear] [Apply]   ║
║                   ║
╚═══════════════════╝
```

### **Search Bar with Suggestions**

```
🔍 Search containers...

Suggestions:
├─ Status: Active (12 results)
├─ Type: Warehouse (8 results)
├─ Created this week (22 results)
└─ Recently modified (5 results)
```

---

## **10. Responsive Design Patterns**

### **Desktop (>1024px)**

- Horizontal action buttons (in-line)
- Sidebar filters
- Multiple columns (list + details)

### **Tablet (768-1024px)**

- Stacked buttons (vertical)
- Bottom sheet for filters
- Single column with expandable rows

### **Mobile (<768px)**

- Icon buttons with labels below
- Full-screen action menus
- Bottom sheet for confirmation
- Swipe gestures for quick actions

```
Mobile Card:
┌────────────────┐
│ Warehouse-001  │
│ ⊚ ACTIVE       │
│                │
│ [Detach] [⋮]   │
└────────────────┘

Tap [⋮]:
┌────────────────┐
│ Detach Child   │
│ Close          │
│ Archive        │
│ View History   │
│ [Close Menu]   │
└────────────────┘
```

---

## **11. Empty/No Data States**

### **No Containers**

```
╔═══════════════════════════════╗
║                               ║
║          📭 Empty             ║
║                               ║
║  No containers found          ║
║                               ║
║  [Create Container]           ║
║                               ║
╚═══════════════════════════════╝
```

### **No Search Results**

```
╔═══════════════════════════════╗
║                               ║
║          🔍 No Results        ║
║                               ║
║  No containers match filter   ║
║  "ARCHIVED + Type: Warehouse" ║
║                               ║
║  [Clear Filters]              ║
║                               ║
╚═══════════════════════════════╝
```

---

## **12. Error States**

### **Permission Denied**

```
╔═══════════════════════════════╗
║  🔒 Permission Denied         ║
├───────────────────────────────┤
║                               ║
║  You don't have permission    ║
║  to close containers.         ║
║                               ║
║  Required Role: Admin         ║
║  Your Role: Operator          ║
║                               ║
║  [Request Access] [Continue]  ║
║                               ║
╚═══════════════════════════════╝
```

### **Invalid Action**

```
╔═══════════════════════════════╗
║  ✗ Cannot Perform Action      ║
├───────────────────────────────┤
║                               ║
║  Cannot Reopen DRAFT          ║
║  container.                   ║
║                               ║
║  Reopen requires CLOSED       ║
║  status.                      ║
║                               ║
║  Current Status: DRAFT        ║
║                               ║
║  [Close]                      ║
║                               ║
╚═══════════════════════════════╝
```

---

## **13. Interaction Feedback**

### **Hover States**

```
Normal:        [Activate Container]
Hover:         [Activate Container] ← Darker background
Active:        [Activate Container] ← Pressed appearance
Disabled:      [Activate Container] ← Grayed out, no-cursor
```

### **Focus States (Accessibility)**

```
⊕ Focus ring visible on keyboard navigation
⊕ High contrast focus outline
⊕ Clear indication of current focused element
```

### **Loading States**

```
Pending:       [⟳ Processing...]
Complete:      [✓ Success]  then  [Activate Container]
Error:         [✗ Failed - Retry]
```

---

## **14. Color Scheme Reference**

### **Status Colors**

```
DRAFT:     #9CA3AF (Gray 400)     RGB: 156, 163, 175
READY:     #3B82F6 (Blue 500)     RGB: 59, 130, 246
ACTIVE:    #10B981 (Green 500)    RGB: 16, 185, 129
CLOSED:    #F97316 (Orange 500)   RGB: 249, 115, 22
ARCHIVED:  #6B7280 (Gray 600)     RGB: 107, 114, 128
```

### **Action Button Colors**

```
Primary:   #3B82F6 (Blue)
Success:   #10B981 (Green)
Danger:    #EF4444 (Red)  - For destructive actions (Close, Archive)
Warning:   #F97316 (Orange)
Disabled:  #D1D5DB (Gray 300)
```

### **Background Colors**

```
Card:      #FFFFFF (White)
Hover:     #F9FAFB (Gray 50)
Disabled:  #F3F4F6 (Gray 100)
Border:    #E5E7EB (Gray 200)
```

---

## **15. Typography & Spacing**

### **Type Hierarchy**

```
Container Title:        24px Bold
Status Text:            16px Medium
Action Label:           14px Regular
Metadata/Timestamp:     12px Light
```

### **Spacing Scale**

```
XS:  4px
S:   8px
M:   16px
L:   24px
XL:  32px
```

### **Card Spacing**

```
┌─ M padding ────────────────┐
│  Title    (24px)           │
│  M space                   │
│  Metadata (12px light)     │
│  L space                   │
│  Actions  (centered)       │
│  M space                   │
└────────────────────────────┘
```

---

## **16. Accessibility Considerations**

### **Color Contrast**

- ✓ All text meets WCAG AA standard (4.5:1 for normal text)
- ✓ Status badges have text + icon (not color-only)
- ✓ Sufficient contrast for color-blind users

### **Keyboard Navigation**

- ✓ Tab order follows visual hierarchy
- ✓ All buttons keyboard accessible
- ✓ Escape closes modals
- ✓ Enter confirms actions

### **Screen Reader Support**

- ✓ Meaningful alt text for icons
- ✓ ARIA labels for status badges
- ✓ Action announcements: "Close container, will affect 3 children"

---

## **17. Dark Mode Support (Optional Phase 2)**

```
Status Colors (Dark Mode):
DRAFT:     #4B5563 (Dark Gray)
READY:     #1E40AF (Dark Blue)
ACTIVE:    #047857 (Dark Green)
CLOSED:    #92400E (Dark Orange)
ARCHIVED:  #374151 (Darker Gray)

Card Background:  #1F2937 (Dark Gray 800)
Text Color:       #F3F4F6 (Light Gray)
Border:           #4B5563 (Dark Gray 700)
```

---

## **Design Principles Summary**

| Principle | Implementation |
|-----------|---|
| **Clarity** | Clear status badges, obvious CTAs |
| **Consistency** | Same action = same location, same appearance |
| **Feedback** | Toast notifications, loading states, animations |
| **Progressive Disclosure** | Show only valid actions for current state |
| **Safety** | Confirmations for destructive actions |
| **Accessibility** | Keyboard nav, screen readers, color contrast |
| **Efficiency** | Quick actions in-line, deeper options in menus |
| **Mobile-First** | Works great on all screen sizes |

---

## **Next Steps for Implementation**

1. **Create Reusable Components**
   - StatusBadge.vue
   - ContainerCard.vue
   - ActionButton.vue
   - ConfirmationModal.vue
   - Timeline.vue

2. **Create Page Templates**
   - Container List Page
   - Container Detail Page
   - Search/Filter Page
   - History Page

3. **Implement Interactions**
   - Status transitions with animations
   - Toast notifications
   - Real-time updates

4. **Test & Validate**
   - Accessibility audit
   - User testing
   - Mobile responsiveness

---

**This design guide is implementation-agnostic and focuses purely on UX/visual patterns.**  
**Component implementation will follow these specifications.**
