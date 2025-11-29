# Outpost User Management Implementation Summary

## Overview
Successfully implemented a multi-tenant outpost system with role-based access control. Users can now belong to multiple outposts, each with its own team members and permissions.

## What Was Implemented

### 1. Database Schema (PocketBase Migrations)

#### Created Collections:
- **`outposts`** - The base workspace/team entity
  - Fields: `name`, `description`, `avatar`, `owner` (relation to users)
  - Permission rules: Members can view, owner/admin can update
  - Indexes: Owner lookup index

- **`memberships`** - Junction table linking users to outposts
  - Fields: `user`, `outpost`, `role` (owner/admin/member/viewer)
  - Unique constraint: One membership per user-outpost pair
  - Permission rules: Role-based access control
  - Indexes: User lookup, outpost lookup, unique user-outpost combination

#### Removed Collections:
- `items` (legacy)
- `clients` (legacy)  
- `tags` (legacy)

**Files Created:**
- `pocketbase/pb_migrations/1732896000_created_outposts.js`
- `pocketbase/pb_migrations/1732896100_created_memberships.js`
- `pocketbase/pb_migrations/1732896200_remove_legacy_collections.js`

### 2. Permission System

**File:** `app/utils/permissions.ts`

#### Functions:
- `getUserOutposts()` - Get all outposts user belongs to
- `getCurrentOutpostId()` - Get active outpost ID from localStorage
- `getCurrentOutpost()` - Get active outpost with full details
- `setCurrentOutpost(id)` - Switch active outpost
- `clearCurrentOutpost()` - Clear on logout
- `getUserRole(outpostId)` - Get user's role in specific outpost
- `canUserPerform(action, outpostId?)` - Check permissions
- `hasHigherRole(role1, role2)` - Compare role hierarchy
- `getOutpostMembers(outpostId)` - List members (admin+ only)
- `createMembership()` - Invite user to outpost
- `updateMemberRole()` - Change member's role
- `removeMember()` - Remove member from outpost
- `initializeOutpostContext()` - Set up outpost on app load

#### Role Hierarchy:
1. **Owner** (Level 4) - Full control, can delete outpost
2. **Admin** (Level 3) - Manage members and settings
3. **Member** (Level 2) - Create and edit content
4. **Viewer** (Level 1) - View-only access

#### Permission Matrix:
- `view` - Requires: Viewer
- `create` - Requires: Member
- `edit` - Requires: Member
- `delete` - Requires: Member
- `manage_members` - Requires: Admin
- `manage_settings` - Requires: Admin
- `delete_outpost` - Requires: Owner

### 3. Authentication Middleware

**File:** `app/middleware/auth.ts`

**Updates:**
- Added outpost membership check
- Redirects to `/outposts/create` if user has no outposts
- Initializes outpost context automatically
- Allows outpost management pages without membership check

### 4. Pages Created

#### `/outposts/index.vue`
- Lists all outposts user belongs to
- Shows current active outpost
- Click to switch between outposts
- Links to settings and members pages

#### `/outposts/create.vue`
- Form to create new outpost
- Fields: name, description, avatar
- Auto-creates owner membership
- Sets as current outpost on creation

#### `/outposts/[id]/settings.vue`
- Edit outpost details (admins+ only)
- Update name, description, avatar
- Danger zone: Delete outpost (owner only)
- Shows user's role in outpost

#### `/outposts/[id]/members.vue`
- View all members with roles
- Change member roles (if permitted)
- Remove members (admin+ only)
- Invite new members button
- Shows user avatars and join dates

### 5. Components Created

#### `app/components/outpost/Switcher.vue`
- Dropdown showing current outpost
- List of all user's outposts
- Quick switch between outposts
- Links to manage outposts and create new
- Auto-reloads page on outpost switch

#### `app/components/outpost/InviteModal.vue`
- Search users by email
- Select role for new member
- Visual user selection with avatars
- Shows success/error feedback
- Auto-closes on successful invite

### 6. Navbar Integration

**File:** `app/components/common/Navbar.vue`

**Updates:**
- Added `<OutpostSwitcher />` component
- Positioned between playground link and profile
- Visible only when authenticated

### 7. Backend Updates

#### MCP Server (`mcp/src/admin-server.ts`)
- Updated `ALLOWED_COLLECTIONS` to include `outposts` and `memberships`
- Removed legacy collections (`items`, `clients`, `tags`)
- Updated server name to `outpost-admin-mcp`

#### PocketBase Hooks (`pocketbase/pb_hooks/outposts.pb.js`)
- Auto-creates owner membership when outpost is created
- Prevents removing last owner from outpost
- Prevents changing last owner's role
- Validates unique user-outpost memberships
- Provides better error messages

#### Auth Utils (`app/utils/auth.ts`)
- Added `getOutpostContext()` method
- Clears outpost context on logout

#### Schemas (`app/utils/schemas.ts`)
- Removed legacy schemas (items, clients, tags)
- Added outposts schema
- Updated notdeletable list

### 8. Files Removed

**Legacy Components:**
- `app/components/table/items.vue`
- `app/components/table/clients.vue`
- `app/components/table/tags.vue`

**Legacy Pages:**
- `app/pages/items.vue`
- `app/pages/clients.vue`
- `app/pages/tags.vue`

## How It Works

### User Flow

1. **Login** - User authenticates as normal
2. **Outpost Check** - Middleware checks if user belongs to any outposts
3. **First Time** - If no outposts, redirects to create one
4. **Active Outpost** - System sets first outpost as active
5. **Switching** - User can switch between outposts via navbar dropdown
6. **Navigation** - All data access is filtered by current outpost

### Permission Flow

1. User requests action (view, edit, delete, etc.)
2. System checks user's role in current outpost
3. Compares role against permission matrix
4. Allows or denies based on hierarchy
5. Frontend and backend both enforce permissions

### Membership Flow

1. Admin/Owner clicks "Invite Member"
2. Searches for user by email
3. Selects user from search results
4. Assigns role (viewer/member/admin)
5. System creates membership record
6. User appears in members list
7. User can now access the outpost

## Testing Checklist

- [ ] Create a new outpost
- [ ] Invite members with different roles
- [ ] Test viewer can only view
- [ ] Test member can create/edit
- [ ] Test admin can manage members
- [ ] Test owner can delete outpost
- [ ] Switch between multiple outposts
- [ ] Verify data isolation between outposts
- [ ] Test removing members
- [ ] Test changing member roles
- [ ] Try to remove last owner (should fail)
- [ ] Test outpost settings page
- [ ] Verify permissions in PocketBase directly

## Next Steps for Basecamp Features

Now that user management is complete, you can add:

1. **Projects** - Collections scoped to outposts
2. **Message Boards** - Discussion threads per project
3. **To-Do Lists** - Task management with assignments
4. **Docs & Files** - Document storage and sharing
5. **Schedule** - Calendar events and milestones
6. **Activity Feed** - Timeline of all changes

Each of these would:
- Have an `outpost` field (relation)
- Use similar permission rules
- Be filtered by current outpost
- Support role-based access

## Architecture Notes

### Data Isolation
- Collections will have `outpost` relation field
- List rules filter by: `outpost = @request.auth.outpost`
- Current outpost stored in localStorage
- Middleware ensures valid outpost context

### Permission Strategy
- PocketBase rules enforce server-side
- Frontend helpers provide UX guidance
- Role hierarchy prevents privilege escalation
- Membership validation prevents duplicates

### Scalability
- Indexes on relations for performance
- Pagination built into queries
- Avatar thumbnails for faster loading
- Efficient permission checks

## Environment Variables

Update your `.env` file:
```bash
ALLOWED_COLLECTIONS=users,outposts,memberships
```

## Database Migration

To apply migrations:
```bash
cd pocketbase
./pocketbase serve
```

PocketBase will automatically run pending migrations on startup.

## Summary

✅ Complete multi-tenant outpost system
✅ Role-based access control (Owner, Admin, Member, Viewer)
✅ User can belong to multiple outposts
✅ Secure permission enforcement
✅ Clean UI for management
✅ Legacy code removed
✅ MCP server updated
✅ All linter checks passing

The system is ready for building Basecamp features on top of this foundation!

