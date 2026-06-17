# CRM Dashboard Components — File Reference

## 📁 Component Files

### Hooks
**File:** `/client/src/hooks/useDashboard.js`
- `useDashboardStats()` — Fetch dashboard metrics (30s refresh)
- `useSendWhatsAppMessage()` — WhatsApp message mutation
- `useSendInstagramReply()` — Instagram reply mutation
- Uses React Query v5.28.0

### Components

**File:** `/client/src/components/dashboard/StatsRow.jsx`
- `StatsRow` — 4 metric cards grid
- `MetricCard` — Individual card component
- Responsive: 4 cols (lg) → 2 cols (sm) → 1 col (mobile)
- Refresh interval: 30 seconds

**File:** `/client/src/components/dashboard/LiveFeed.jsx`
- `LiveFeed` — Message feed container
- `LiveFeedMessageItem` — Individual message row
- `LiveFeedSkeleton` — Loading state
- `formatTimeAgo()` — Time formatting utility
- Polling interval: 15 seconds
- Inline reply functionality

**File:** `/client/src/components/dashboard/PipelineMini.jsx`
- `PipelineMini` — Pipeline stage summary
- 5 stages: New, Contacted, Qualified, Proposal Sent, Close Won
- Progress bars showing % of total leads
- Refresh interval: 30 seconds (shared with dashboard stats)

### Pages

**File:** `/client/src/pages/Dashboard.jsx`
- Main dashboard page
- Combines all 3 components
- 2-column responsive layout
- Includes legacy charts section

## 🎨 Styling

**File:** `/client/src/index.css`
- Added `.custom-scrollbar` utility class
- Smooth webkit scrollbar styling
- Complements existing glassmorphism design

## 📦 Imports Reference

```javascript
// Hook imports
import { useDashboardStats, useSendWhatsAppMessage, useSendInstagramReply } from "@/hooks/useDashboard";

// Component imports
import { StatsRow } from "@/components/dashboard/StatsRow";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { PipelineMini } from "@/components/dashboard/PipelineMini";

// Dashboard page
import Dashboard from "@/pages/Dashboard";
```

## 🔗 API Endpoints Used

| Endpoint | Method | Used By | Interval |
|----------|--------|---------|----------|
| `/api/analytics/dashboard` | GET | StatsRow, PipelineMini | 30s |
| `/api/leads` | GET | LiveFeed | 15s |
| `/api/whatsapp/send` | POST | LiveFeed (Reply) | On demand |
| `/api/instagram/reply` | POST | LiveFeed (Reply) | On demand |

## 📊 Component Props

All components are **prop-less** and self-contained:
```jsx
<StatsRow />
<LiveFeed />
<PipelineMini />
```

They fetch their own data via React Query hooks.

## 🎯 Quick Integration

To add dashboard to an existing layout page:

```jsx
import { StatsRow } from "@/components/dashboard/StatsRow";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { PipelineMini } from "@/components/dashboard/PipelineMini";

export default function MyPage() {
  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>
      
      {/* Stats */}
      <StatsRow />
      
      {/* 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveFeed />
        </div>
        <div className="lg:col-span-1">
          <PipelineMini />
        </div>
      </div>
    </div>
  );
}
```

## 🧪 Testing Checklist

- [ ] StatsRow displays 4 cards with data
- [ ] Stats update every 30 seconds
- [ ] LiveFeed shows 15 messages (scrollable)
- [ ] Messages refresh every 15 seconds
- [ ] Click Reply expands inline panel
- [ ] Send message posts to API
- [ ] Unread messages have blue left border
- [ ] PipelineMini shows 5 stages with %
- [ ] Responsive on desktop (2 col layout)
- [ ] Responsive on tablet (stacked)
- [ ] Responsive on mobile (full width)

## 📱 Breakpoints

- **Desktop:** `lg:` (≥1024px) — 2 column layout (60/40)
- **Tablet:** `md:` (≥768px) — 2 column layout, responsive text
- **Mobile:** `sm:` (≥640px) → `<sm:` — Single column stacked

## 🎨 Color Scheme

- **StatsRow Metrics:**
  - Total Leads: blue (bg-blue-500/5, text-blue-400)
  - New Today: green (bg-green-500/5, text-green-400)
  - WhatsApp: green (green badge)
  - Instagram: pink (pink badge)

- **PipelineMini Stages:**
  - New: blue
  - Contacted: purple
  - Qualified: orange
  - Proposal Sent: yellow
  - Closed Won: green

## ⚙️ Configuration

### React Query
```javascript
{
  queryKey: ["dashboardStats"],
  refetchInterval: 30000,       // 30 seconds
  staleTime: 25000,
  retry: 2
}
```

### Polling
```javascript
const interval = setInterval(fetchMessages, 15000); // 15 seconds
return () => clearInterval(interval);               // Cleanup
```

## 🚀 Performance

- **Caching:** React Query manages cache with 30s staleTime
- **Polling:** 15s for messages (efficient for real-time feel)
- **Rendering:** Memoization via component separation
- **Scrolling:** Fixed height container (h-600px) prevents layout shift

## 🐞 Common Issues & Solutions

### "No messages showing"
- Verify `/api/leads` returns data with `last_message` field
- Check that `last_activity_at` is populated
- Open DevTools console for error logs

### "Stats not updating"
- Check browser Network tab for 30s requests
- Verify `/api/analytics/dashboard` endpoint returns data
- Check React Query DevTools

### "Reply not sending"
- Verify `/api/whatsapp/send` or `/api/instagram/send` endpoints exist
- Check JWT token is valid (check localStorage)
- Look for error logs in browser console

### "Components not responsive"
- Verify TailwindCSS is configured correctly
- Check breakpoints: `lg:`, `md:`, `sm:`
- Test on mobile device or browser dev tools

## 📞 Support

See `/client/DASHBOARD_COMPLETE.md` for full documentation and examples.
