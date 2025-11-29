# Member System Simplification - Changes Summary

## Overview
The member management system has been simplified by removing the separate `memberships` collection and replacing it with a direct multi-relation field (`members`) in the `outposts` collection. This makes the system much simpler - only the **owner** of an outpost can add/remove members.

## What Changed

### 1. Database Schema
- **Added** `members` field to `outposts` collection (multi-relation to users)
- **Removed** `memberships` collection (data is migrated automatically)
- **Updated** access rules to allow members to view outposts they belong to

### 2. Role System Simplified
- **Before**: owner, admin, member, viewer (4 roles)
- **After**: owner, member (2 roles)
- Only the owner can add/remove members and manage settings
- All members have equal access (can view and collaborate on projects)

### 3. Files Changed

#### Migrations
- `pocketbase/pb_migrations/1760900000_add_members_to_outposts.js` - Adds members field
- `pocketbase/pb_migrations/1760900100_deprecate_memberships.js` - Migrates data and removes memberships collection

#### Backend
- `pocketbase/pb_hooks/outposts.pb.js` - Simplified hooks (no more membership management)

#### Frontend Utils
- `app/utils/permissions.ts` - Completely refactored to use direct member relations
  - Removed: `createMembership()`, `updateMemberRole()` (replaced with simpler functions)
  - Added: `addMember()` (only owner can call)
  - Simplified: `removeMember()` (only owner can call)
  - Simplified: `getUserRole()`, `getOutpostMembers()`, etc.

#### Frontend Pages
- `app/pages/create.vue` - Removed membership creation code
- `app/pages/[id]/members.vue` - Simplified UI (no role selection)
- `app/components/outpost/InviteModal.vue` - Simplified (no role selection)
- `app/pages/[id]/projects/[projectId]/members.vue` - Simplified for outpost-level permissions

#### MCP Server
- `mcp/src/admin-server.ts` - Removed `memberships` from allowed collections

## How to Apply Changes

1. **Stop PocketBase** if it's running

2. **Run the migrations**:
   ```bash
   cd pocketbase
   ./pocketbase migrate
   ```
   
   This will:
   - Add the `members` field to outposts
   - Migrate all existing membership data to the new field
   - Delete the memberships collection

3. **Restart your application**:
   ```bash
   # In the app directory
   npm run dev
   
   # In a separate terminal for PocketBase
   cd pocketbase
   ./pocketbase serve
   ```

## New Member Management Flow

### Adding a Member (Owner Only)
1. Navigate to an outpost's members page (`/[outpostId]/members`)
2. Click "Add Member"
3. Search for a user by email
4. Click "Add Member" (they become a regular member automatically)

### Removing a Member (Owner Only)
1. Navigate to the members page
2. Click "Remove" next to any member (except the owner)

### Permissions
- **Owner**: Can do everything (manage members, settings, delete outpost)
- **Member**: Can view and collaborate on all projects in the outpost

## Breaking Changes

⚠️ **Important**: These functions are no longer available or have changed:

1. `updateMemberRole()` - Removed (no longer needed, roles are fixed)
2. `createMembership()` - Replaced with `addMember()` (no role parameter)
3. Role-based access beyond owner/member is no longer supported

## Migration Notes

- **Existing data**: All current memberships will be automatically migrated to the new system
- **Roles**: Previous admin/member/viewer roles will all become "member" in the new system
- **Owner**: Outpost owners remain owners (not in the members array)
- **Access**: All members now have equal access to all projects in the outpost

## Testing Checklist

After applying the changes, test:

- [ ] Create a new outpost
- [ ] Add a member to the outpost
- [ ] Remove a member from the outpost
- [ ] Verify members can access all projects
- [ ] Verify only owner can add/remove members
- [ ] Check that outpost switcher works
- [ ] Verify project member pages work correctly

## Rollback

If you need to rollback:

1. The migration files include a rollback function
2. Run: `./pocketbase migrate down` (in pocketbase directory)
3. Note: This will recreate the memberships collection structure but won't restore the data

## Support

If you encounter any issues:
1. Check PocketBase logs for migration errors
2. Check browser console for frontend errors
3. Verify your user has the "owner" role on outposts you're trying to manage

