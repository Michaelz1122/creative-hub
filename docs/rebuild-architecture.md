# Creative Hub Rebuild Architecture

## Product Thesis

Creative Hub should behave like a learning operating system for Egyptians entering or leveling up in digital and creative work.

The roadmap is the heart.
The dashboard is the product.
The admin is the control center.
Toolkits and content support the roadmap instead of competing with it.

## Old Repo Decision Map

### Keep or reuse ideas

- Google sign-in and session concepts
- manual payment receipt flow concept
- coupon validation rules
- feedback submission concept
- admin-managed sections and settings idea
- track-aware toolkits and content direction

### Refactor heavily

- membership model from one global paid flag to proper plan and entitlement records
- roadmap from `completedDays` arrays to structured weeks, days, tasks, and quizzes
- settings from loose JSON blobs to typed entities where it matters
- dashboard from a resource hub into a guided progress workspace
- admin from scattered sections into domain-led management areas

### Rebuild from scratch

- information architecture
- user dashboard UX
- admin dashboard UX
- permissions system
- notification center
- roadmap builder
- track landing pages
- pricing structure
- premium but calmer design language

## System Architecture

### Application layers

1. Marketing layer
   - homepage
   - pricing
   - track landing pages
   - FAQ and basic legal pages

2. Learner product layer
   - dashboard home
   - per-track experience
   - roadmap
   - content library
   - toolkits
   - feedback center
   - billing and notifications

3. Admin control layer
   - growth and operations overview
   - payments
   - memberships
   - tracks
   - roadmap builder
   - content manager
   - toolkit manager
   - feedback inbox
   - coupons and promos
   - landing builder
   - email center
   - settings and permissions

4. Domain layer
   - users and identities
   - roles and permissions
   - plans and entitlements
   - tracks and roadmap
   - content and toolkit resources
   - payments and coupons
   - notifications and announcements
   - audits and analytics events

## Route and Page Map

### Marketing

- `/`
- `/pricing`
- `/tracks/[slug]`
- `/faq`
- `/about`
- `/contact`
- `/legal/privacy`
- `/legal/terms`

### Authentication

- `/login`
- `/auth/callback/google`

### Learner Dashboard

- `/dashboard`
- `/dashboard/tracks`
- `/dashboard/tracks/[slug]`
- `/dashboard/tracks/[slug]/roadmap`
- `/dashboard/tracks/[slug]/library`
- `/dashboard/tracks/[slug]/toolkits`
- `/dashboard/tracks/[slug]/community`
- `/dashboard/feedback`
- `/dashboard/billing`
- `/dashboard/notifications`
- `/dashboard/settings`

### Admin

- `/admin`
- `/admin/users`
- `/admin/memberships`
- `/admin/payments`
- `/admin/tracks`
- `/admin/tracks/[id]/roadmap`
- `/admin/content`
- `/admin/toolkits`
- `/admin/feedback`
- `/admin/community`
- `/admin/landing`
- `/admin/coupons`
- `/admin/emails`
- `/admin/announcements`
- `/admin/seo`
- `/admin/settings`
- `/admin/roles`
- `/admin/activity`

## Data Model Map

### Identity and permissions

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `UserSession`

### Product structure

- `Track`
- `TrackCommunity`
- `TrackMilestone`
- `RoadmapWeek`
- `RoadmapDay`
- `RoadmapTask`
- `RoadmapResourceLink`

### Learning content

- `ContentItem`
- `ToolkitItem`
- `CareerResource`
- `Quiz`
- `QuizQuestion`
- `QuizChoice`
- `QuizAttempt`
- `TaskCompletion`

### Commercial

- `Plan`
- `Membership`
- `MembershipEntitlement`
- `Coupon`
- `CouponRedemption`
- `PaymentRequest`
- `PaymentReviewLog`
- `PricingSnapshot`

### Communication and operations

- `Notification`
- `Announcement`
- `EmailTemplate`
- `EmailCampaign`
- `LandingPage`
- `LandingSection`
- `AuditLog`

## Learner Dashboard Information Architecture

### Dashboard home

- welcome and membership summary
- continue where you stopped
- today’s tasks
- current week objective
- active tracks
- notifications
- quick actions
- upcoming quizzes and reminders

### My Tracks

- active tracks
- locked tracks
- coming soon tracks
- progress by track
- direct resume entry points

### Track workspace

- track overview
- roadmap
- content library
- toolkits
- community
- feedback history
- quiz history

### Billing and account

- memberships
- payment requests
- coupon history
- notifications
- profile and settings

## Admin Dashboard Information Architecture

### Operations overview

- total users
- active memberships
- pending payments
- pending feedback
- roadmap engagement
- top tracks
- revenue and approval snapshots

### Core management modules

- users
- memberships and pricing
- payment review queue
- tracks
- roadmap builder
- content library
- toolkits
- feedback inbox
- community links
- coupons
- announcements
- emails
- landing builder
- SEO
- settings
- roles and permissions
- audit logs

## Roadmap Data Structure

### Track level

- title
- slug
- status
- orientation copy
- roadmap length
- community link

### Week level

- week number
- title
- objective
- explanation
- expected outcome
- quiz reference
- publish state

### Day level

- day number
- theme
- estimated total time
- unlock rules

### Task level

- title
- why it matters
- instructions
- expected output
- estimated minutes
- difficulty
- help notes
- common issues
- checklist items
- linked content resources
- linked toolkit resources

## Manual Payment Flow

1. User selects a plan.
2. User sees Vodafone Cash instructions and pricing summary.
3. User uploads receipt screenshot and optional note.
4. System stores request with pricing snapshot, coupon snapshot, and receipt URL.
5. Admin reviews in payment queue.
6. Admin approves or rejects with note.
7. On approval:
   - membership record is activated
   - entitlements are granted for track or all-access
   - notification and email are sent
   - audit trail is written
8. On rejection:
   - request becomes rejected
   - note is stored
   - notification and email are sent

## Design System Direction

- dark premium but calmer than the old version
- Arabic-first copy with selective English terms
- fewer visual effects, stronger hierarchy
- dashboard surfaces feel operational rather than decorative
- cards and previews communicate progress and guidance
- mobile usability is non-negotiable
- trust and clarity are more important than hype

## Delivery Plan

### Slice 1

- architecture and schema
- marketing homepage
- dashboard shell
- admin shell

### Slice 2

- authentication and session model
- track workspace and roadmap pages
- plan selection and payment submission

### Slice 3

- admin payment review
- memberships and entitlements
- notifications and email events

### Slice 4

- roadmap builder
- content and toolkit managers
- quiz system

