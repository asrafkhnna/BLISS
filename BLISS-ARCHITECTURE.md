# BLISS — Technical Architecture & Database Schema

**Status:** Architecture baseline for the first implementation
**Product:** Mobile-first social learning app with entertainment reels, study reels, filtered chat, messaging, discovery, profiles, follows, saves, reports and blocking.
**Starter constraints:** Expo Router + React Native + TypeScript + NativeWind, Express/tRPC API, Drizzle ORM, managed MySQL, Manus Authentication/Storage/Service APIs.

---

## 1. Product boundaries

### Core v1 capabilities

1. Secure sign-up/login and onboarding.
2. Two vertical reel experiences:
   - **Social:** entertainment and interest-based content.
   - **Study:** subject, topic and level filters.
3. Reel creation metadata: upload, caption, category, thumbnail, subject/topic/level for study content.
4. Reel actions: like, comment, share, save and follow creator.
5. Search and discovery for users, creators, subjects and topics.
6. Filter-based chat discovery and one-to-one direct messaging.
7. Profiles with photo, bio, interests, follower/following counts, posted reels and saved reels.
8. Safety controls: block/report users, messages and reels.
9. Optional later capability: notifications for messages, follows, comments and study activity.

### Explicit non-goals for the first slice

- No public group chat.
- No live streaming.
- No payments or subscriptions.
- No recommendation model dependency; v1 uses deterministic ranking and can later add ML/LLM signals.
- No separate credential system; Manus OAuth/application authentication remains the identity authority.

---

## 2. System architecture

```text
┌─────────────────────────────────────────────────────────┐
│ Expo Router mobile client                               │
│ React Native + NativeWind + TanStack Query/tRPC client  │
│ Feed, Study filters, Create, Search, Chat, Profile      │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS / tRPC
                ▼
┌─────────────────────────────────────────────────────────┐
│ Express API + tRPC routers                              │
│ auth context · validation · authorization · rate limits │
│ feed · reels · social · chat · discovery · moderation   │
└───────┬─────────────────┬─────────────────┬─────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
│ MySQL/Drizzle │  │ Object store │  │ Manus services   │
│ users + BLISS │  │ video/image  │  │ auth, alerts,    │
│ domain data   │  │ files        │  │ optional AI      │
└───────────────┘  └──────────────┘  └──────────────────┘
```

### Runtime

- **Mobile/Web preview:** Expo Metro on port `8081`.
- **API:** Express server on port `3000`.
- **Database:** Managed MySQL accessed through Drizzle.
- **Authentication:** OAuth callback creates/updates `users`; API derives `ctx.user` from the authenticated session.
- **Media:** Upload bytes to managed storage; persist only stable storage keys/URLs and metadata in MySQL.
- **API style:** tRPC procedures grouped by domain. All procedures validate input with the project’s existing schema-validation approach before database access.

### Recommended source structure

```text
app/
  (tabs)/
    index.tsx              # Home/social feed shell
    study.tsx              # Study feed + filters
    create.tsx             # Reel creation entry point
    search.tsx             # Discovery/search
    chat.tsx               # Conversation list
    profile.tsx             # Current-user profile
  reel/[id].tsx            # Reel detail/comments
  profile/[id].tsx         # Public profile
  chat/[id].tsx            # One-to-one conversation
components/bliss/
  ReelCard.tsx
  FeedPager.tsx
  StudyFilterBar.tsx
  ProfileHeader.tsx
  ChatRow.tsx
  MessageBubble.tsx
  SafetyMenu.tsx
server/routers/
  feed.ts
  reels.ts
  social.ts
  discovery.ts
  chat.ts
  profiles.ts
  moderation.ts
drizzle/
  schema.ts
  relations.ts
```

---

## 3. Client navigation and state

### Bottom navigation

1. **Home** — social reels with a compact toggle to Study.
2. **Study** — subject/topic/level filter chips and study reel feed.
3. **Create** — upload or record a short reel, select category and metadata.
4. **Inbox** — chat list, unread counts and filtered chat discovery.
5. **Profile** — current user profile, tabs for posts/saved/about.

### State rules

- Use server state for feeds, profiles, chat lists and mutations.
- Keep feed cursor and active filters in screen state/query keys.
- Optimistically update like/save/follow counts, then roll back on mutation failure.
- Do not store authentication tokens in ordinary component state or source files.
- Cache public profiles briefly; invalidate the current user after profile mutation.
- Messages use cursor pagination; a later phase may add WebSocket/SSE delivery, while v1 can refresh on focus and after send.

### Mobile interaction rules

- Portrait-first, one-handed controls.
- Reels use a full-height pager with an overlaid action rail.
- Study filters remain horizontally scrollable above the feed.
- Destructive report/block actions use a native confirmation on native and a controlled web modal on Expo Web.

---

## 4. Database design

All tables use integer auto-increment primary keys unless a UUID is required for external exposure. Public API routes should expose opaque IDs or validated numeric IDs consistently; do not expose internal authorization assumptions through client-controlled fields.

### 4.1 Existing identity table

Keep the starter `users` table and extend it with profile fields rather than replacing it.

```ts
users {
  id: int PK auto_increment
  openId: varchar(64) UNIQUE NOT NULL
  name: text NULL
  email: varchar(320) NULL
  loginMethod: varchar(64) NULL
  role: enum('user','admin') NOT NULL DEFAULT 'user'
  avatarUrl: text NULL
  bio: text NULL
  onboardingComplete: boolean NOT NULL DEFAULT false
  createdAt: timestamp NOT NULL
  updatedAt: timestamp NOT NULL
  lastSignedIn: timestamp NOT NULL
}
```

### 4.2 User preferences and interests

```ts
userPreferences {
  userId: int PK/FK users.id
  preferredFeed: enum('social','study') NOT NULL DEFAULT 'social'
  studyLevel: varchar(32) NULL
  notificationsEnabled: boolean NOT NULL DEFAULT true
  createdAt: timestamp NOT NULL
  updatedAt: timestamp NOT NULL
}

interests {
  id: int PK
  slug: varchar(80) UNIQUE NOT NULL
  label: varchar(120) NOT NULL
  kind: enum('social','study','both') NOT NULL
  createdAt: timestamp NOT NULL
}

userInterests {
  userId: int PK/FK users.id
  interestId: int PK/FK interests.id
  createdAt: timestamp NOT NULL
}
```

### 4.3 Reels and study metadata

```ts
reels {
  id: int PK
  creatorId: int FK users.id NOT NULL
  category: enum('social','study') NOT NULL
  caption: text NULL
  mediaKey: varchar(512) NOT NULL       // managed storage key
  mediaUrl: text NULL                   // derived/cacheable public URL
  thumbnailKey: varchar(512) NULL
  durationMs: int NULL
  status: enum('processing','published','hidden','removed') NOT NULL DEFAULT 'processing'
  visibility: enum('public','followers','private') NOT NULL DEFAULT 'public'
  likeCount: int NOT NULL DEFAULT 0
  commentCount: int NOT NULL DEFAULT 0
  saveCount: int NOT NULL DEFAULT 0
  viewCount: int NOT NULL DEFAULT 0
  publishedAt: timestamp NULL
  createdAt: timestamp NOT NULL
  updatedAt: timestamp NOT NULL
}

studyReelMetadata {
  reelId: int PK/FK reels.id
  subject: varchar(120) NOT NULL
  topic: varchar(160) NOT NULL
  level: varchar(64) NOT NULL
  examTag: varchar(120) NULL
  language: varchar(32) NULL
  createdAt: timestamp NOT NULL
}

reelInterests {
  reelId: int PK/FK reels.id
  interestId: int PK/FK interests.id
  createdAt: timestamp NOT NULL
}
```

**Indexes:**

- `reels(category, status, publishedAt DESC)` for feed pages.
- `reels(creatorId, status, publishedAt DESC)` for profiles.
- `studyReelMetadata(subject, topic, level, reelId)` for filtered study feeds.
- `reels(status, visibility, createdAt)` for moderation queues.

### 4.4 Reel engagement

```ts
reelLikes {
  reelId: int PK/FK reels.id
  userId: int PK/FK users.id
  createdAt: timestamp NOT NULL
}

reelSaves {
  reelId: int PK/FK reels.id
  userId: int PK/FK users.id
  createdAt: timestamp NOT NULL
}

reelViews {
  id: bigint PK
  reelId: int FK reels.id NOT NULL
  viewerId: int FK users.id NULL
  sessionKey: varchar(128) NULL
  watchedMs: int NULL
  createdAt: timestamp NOT NULL
}

reelComments {
  id: int PK
  reelId: int FK reels.id NOT NULL
  authorId: int FK users.id NOT NULL
  parentId: int FK reelComments.id NULL
  body: varchar(1000) NOT NULL
  status: enum('visible','hidden','removed') NOT NULL DEFAULT 'visible'
  createdAt: timestamp NOT NULL
  updatedAt: timestamp NOT NULL
}
```

Use unique composite keys on likes and saves to make mutation retries idempotent.

### 4.5 Follows and discovery

```ts
userFollows {
  followerId: int PK/FK users.id
  followingId: int PK/FK users.id
  createdAt: timestamp NOT NULL
}

searchDocuments {
  id: bigint PK
  entityType: enum('user','reel','subject','topic') NOT NULL
  entityId: int NOT NULL
  searchableText: text NOT NULL
  status: enum('active','hidden') NOT NULL DEFAULT 'active'
  updatedAt: timestamp NOT NULL
}
```

- Enforce `followerId != followingId` in the mutation layer.
- Index follows by both directions: `(followerId, createdAt)` and `(followingId, createdAt)`.
- Start discovery with MySQL prefix/full-text-compatible queries; add a search service only after usage justifies it.

### 4.6 Direct chat

```ts
conversations {
  id: int PK
  type: enum('direct') NOT NULL DEFAULT 'direct'
  directKey: varchar(80) UNIQUE NOT NULL  // sorted user IDs, e.g. 12:47
  lastMessageId: int NULL
  lastMessageAt: timestamp NULL
  createdAt: timestamp NOT NULL
  updatedAt: timestamp NOT NULL
}

conversationMembers {
  conversationId: int PK/FK conversations.id
  userId: int PK/FK users.id
  lastReadMessageId: int NULL
  muted: boolean NOT NULL DEFAULT false
  joinedAt: timestamp NOT NULL
}

messages {
  id: int PK
  conversationId: int FK conversations.id NOT NULL
  senderId: int FK users.id NOT NULL
  body: varchar(4000) NOT NULL
  messageType: enum('text','reel_share','system') NOT NULL DEFAULT 'text'
  sharedReelId: int FK reels.id NULL
  status: enum('sent','hidden','removed') NOT NULL DEFAULT 'sent'
  createdAt: timestamp NOT NULL
  updatedAt: timestamp NOT NULL
}

chatDiscoveryPreferences {
  userId: int PK/FK users.id
  subjects: text NULL             // JSON array or normalized later
  levels: text NULL
  interests: text NULL
  discoverable: boolean NOT NULL DEFAULT true
  updatedAt: timestamp NOT NULL
}
```

**Chat invariants:**

- A direct conversation always has exactly two active members.
- `directKey` is generated server-side from sorted member IDs.
- Sender must be an active member at message creation time.
- A blocked relationship prevents new messages and hides the conversation from discovery.
- Message bodies are never accepted from unauthenticated requests.

### 4.7 Safety and moderation

```ts
userBlocks {
  blockerId: int PK/FK users.id
  blockedId: int PK/FK users.id
  createdAt: timestamp NOT NULL
}

reports {
  id: int PK
  reporterId: int FK users.id NOT NULL
  targetType: enum('user','reel','comment','message') NOT NULL
  targetId: int NOT NULL
  reason: enum('spam','harassment','nudity','violence','misinformation','other') NOT NULL
  details: varchar(2000) NULL
  status: enum('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open'
  reviewerId: int FK users.id NULL
  createdAt: timestamp NOT NULL
  resolvedAt: timestamp NULL
}
```

Indexes: `reports(status, createdAt)`, `reports(targetType, targetId)`, and both directions for blocks.

### 4.8 Notifications (optional but schema-ready)

```ts
notifications {
  id: int PK
  recipientId: int FK users.id NOT NULL
  actorId: int FK users.id NULL
  type: enum('message','follow','comment','like','study_activity') NOT NULL
  reelId: int FK reels.id NULL
  conversationId: int FK conversations.id NULL
  readAt: timestamp NULL
  createdAt: timestamp NOT NULL
}
```

Use in-app notifications first. Email/push delivery should be an asynchronous adapter and must not block the original mutation.

---

## 5. API contract

### Feed

```text
feed.social({ cursor?, limit?, interests? })
feed.study({ cursor?, limit?, subject?, topic?, level? })
feed.byCreator({ creatorId, cursor?, limit? })
feed.saved({ cursor?, limit? })
```

Return a stable cursor page:

```ts
{
  items: ReelCard[];
  nextCursor: string | null;
}
```

Use `(publishedAt, id)` as the cursor sort tuple to avoid duplicates when timestamps tie.

### Reels

```text
reels.createUploadIntent({ fileName, mimeType, sizeBytes })
reels.create({ mediaKey, thumbnailKey?, category, caption?, studyMetadata? })
reels.publish({ reelId })
reels.like({ reelId, value: boolean })
reels.save({ reelId, value: boolean })
reels.comment({ reelId, body, parentId? })
reels.shareToChat({ reelId, conversationId })
```

The server verifies ownership of upload keys and never trusts a client-provided creator ID.

### Profiles and social graph

```text
profiles.me()
profiles.byId({ userId })
profiles.update({ name?, avatarKey?, bio?, interests? })
social.follow({ userId, value: boolean })
social.followers({ userId, cursor? })
social.following({ userId, cursor? })
```

### Discovery and chat

```text
discovery.search({ query, kind?, cursor? })
discovery.chatCandidates({ subject?, level?, interest?, cursor? })
chat.list({ cursor? })
chat.get({ conversationId, cursor? })
chat.getOrCreateDirect({ otherUserId })
chat.send({ conversationId, body, sharedReelId? })
chat.markRead({ conversationId, messageId })
```

### Safety

```text
moderation.blockUser({ userId })
moderation.unblockUser({ userId })
moderation.report({ targetType, targetId, reason, details? })
moderation.listBlocked()
```

---

## 6. Authorization and safety model

- Every private procedure requires an authenticated `ctx.user`.
- Public procedures still apply visibility, status and block filters.
- A blocked user is excluded from feeds, search, profile interactions and chat candidate results in both directions.
- Ownership checks are mandatory for reel edits, deletes, publishing and profile changes.
- Admin moderation procedures require `users.role = 'admin'`.
- Validate caption/comment/message lengths server-side.
- Rate-limit message sending, comments, reports, follow toggles and upload-intent creation.
- Store only media keys and metadata; never trust arbitrary client URLs for protected media.
- Sanitize or safely render user text; do not interpret message/caption content as HTML.
- Report mutations must be idempotent enough to prevent accidental duplicate floods.

---

## 7. Feed ranking baseline

### Social feed score

```text
score = freshness
      + interestMatch * 0.35
      + creatorFollow * 0.20
      + engagementQuality * 0.15
      - alreadySeen * 0.60
```

### Study feed score

```text
score = exactSubjectMatch * 0.35
      + exactTopicMatch * 0.30
      + levelMatch * 0.20
      + freshness * 0.10
      + saveRate * 0.05
```

Implement the first version as SQL ordering plus lightweight application scoring. Keep the scoring function isolated so it can later consume watch time, completion rate, hidden-content feedback and recommendation-service output.

---

## 8. Upload and media lifecycle

1. Client requests an upload intent with MIME type and byte size.
2. Server validates allowed media types and size limits.
3. Client uploads to managed storage.
4. Client submits `reels.create` with the returned storage key.
5. Server creates `processing` reel row.
6. Processing extracts duration/thumbnail if supported; update metadata.
7. Server changes status to `published` only after the media is readable.
8. Failed processing changes status to `hidden` and returns a retryable error.

Suggested v1 limits: 60 seconds, 100 MB, MP4/MOV video, JPEG/PNG/WebP thumbnails. Make limits configuration constants rather than scattered literals.

---

## 9. Implementation sequence

### Slice A — user-facing core

- Rename app branding to **BLISS**.
- Build Home social feed shell and Study feed toggle.
- Add seeded in-memory/mock feed data only for UI work if database tables are not yet migrated.
- Build profile header, counts, tabs and reel grid/list.
- Build chat list and conversation detail shell.

### Slice B — persistence

- Add profile, reels, study metadata, likes, saves, follows and comments tables.
- Add tRPC feed/profile/reel/social procedures.
- Run migration and `pnpm db:push` only after schema is reviewed.

### Slice C — real media and chat

- Add storage upload intent flow.
- Add conversation/member/message tables and chat procedures.
- Add blocked-user filtering and message authorization.

### Slice D — moderation and polish

- Reports, admin review state, notifications, analytics events, ranking refinement and offline/error states.

---

## 10. Observability and operational checks

Track structured events for:

- `reel_impression`, `reel_watch`, `reel_like`, `reel_save`, `reel_share`.
- `study_filter_used`, `search_performed`, `profile_viewed`.
- `chat_started`, `message_sent`, `message_reported`.
- `upload_started`, `upload_failed`, `reel_published`.

Never log message bodies, OAuth credentials, storage signatures or private media URLs. Monitor API latency by router, database errors, upload failures, moderation queue age and notification failure rate.
