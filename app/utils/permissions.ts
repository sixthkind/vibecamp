import { pb } from './pb';

// Role hierarchy levels (higher = more permissions)
const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

// Actions that can be performed
export type Action = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'manage_members' 
  | 'manage_settings'
  | 'delete_outpost';

// Permission matrix: minimum role required for each action
const PERMISSION_MATRIX: Record<Action, Role> = {
  view: 'viewer',
  create: 'member',
  edit: 'member',
  delete: 'member',
  manage_members: 'admin',
  manage_settings: 'admin',
  delete_outpost: 'owner',
};

/**
 * Get all outposts the current user belongs to
 */
export async function getUserOutposts() {
  const userId = pb.authStore.record?.id;
  if (!userId) return [];

  try {
    // Get memberships for the user
    const memberships = await pb.collection('memberships').getFullList({
      filter: `user = "${userId}"`,
      expand: 'outpost',
      sort: '-created',
    });

    // Get outposts where user is owner (might not have membership yet)
    const ownedOutposts = await pb.collection('outposts').getFullList({
      filter: `owner = "${userId}"`,
      sort: '-created',
    });

    // Combine and deduplicate
    const outpostMap = new Map();
    
    // Add owned outposts
    ownedOutposts.forEach(outpost => {
      outpostMap.set(outpost.id, {
        ...outpost,
        userRole: 'owner' as Role,
      });
    });

    // Add memberships (will override if owner, but that's fine)
    memberships.forEach(membership => {
      const outpost = membership.expand?.outpost;
      if (outpost) {
        outpostMap.set(outpost.id, {
          ...outpost,
          userRole: membership.role as Role,
        });
      }
    });

    return Array.from(outpostMap.values());
  } catch (error) {
    console.error('Error fetching user outposts:', error);
    return [];
  }
}

/**
 * Get the current active outpost ID from localStorage
 */
export function getCurrentOutpostId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentOutpostId');
}

/**
 * Get the current active outpost with full details
 */
export async function getCurrentOutpost() {
  const outpostId = getCurrentOutpostId();
  if (!outpostId) return null;

  try {
    const outpost = await pb.collection('outposts').getOne(outpostId);
    const role = await getUserRole(outpostId);
    return {
      ...outpost,
      userRole: role,
    };
  } catch (error) {
    console.error('Error fetching current outpost:', error);
    // Clear invalid outpost ID
    localStorage.removeItem('currentOutpostId');
    return null;
  }
}

/**
 * Set the current active outpost
 */
export function setCurrentOutpost(outpostId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentOutpostId', outpostId);
  
  // Dispatch custom event so components can react to outpost changes
  window.dispatchEvent(new CustomEvent('outpost-changed', { detail: { outpostId } }));
}

/**
 * Clear the current outpost (e.g., on logout)
 */
export function clearCurrentOutpost() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('currentOutpostId');
}

/**
 * Get the user's role in a specific outpost
 */
export async function getUserRole(outpostId: string): Promise<Role | null> {
  const userId = pb.authStore.record?.id;
  if (!userId) return null;

  try {
    // Check if user is the owner
    const outpost = await pb.collection('outposts').getOne(outpostId);
    if (outpost.owner === userId) {
      return 'owner';
    }

    // Check membership
    const memberships = await pb.collection('memberships').getFullList({
      filter: `user = "${userId}" && outpost = "${outpostId}"`,
      limit: 1,
    });

    if (memberships.length > 0) {
      return memberships[0].role as Role;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

/**
 * Check if a user can perform a specific action
 */
export async function canUserPerform(
  action: Action,
  outpostId?: string
): Promise<boolean> {
  const userId = pb.authStore.record?.id;
  if (!userId) return false;

  // Use current outpost if not specified
  const targetOutpostId = outpostId || getCurrentOutpostId();
  if (!targetOutpostId) return false;

  const userRole = await getUserRole(targetOutpostId);
  if (!userRole) return false;

  const requiredRole = PERMISSION_MATRIX[action];
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role has sufficient permissions compared to another role
 * Useful for validating if a user can modify another user's role
 */
export function hasHigherRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Get all members of an outpost (requires admin or owner)
 */
export async function getOutpostMembers(outpostId: string) {
  try {
    const memberships = await pb.collection('memberships').getFullList({
      filter: `outpost = "${outpostId}"`,
      expand: 'user',
      sort: '-created',
    });

    return memberships.map(membership => ({
      id: membership.id,
      userId: membership.user,
      role: membership.role as Role,
      created: membership.created,
      user: membership.expand?.user,
    }));
  } catch (error) {
    console.error('Error fetching outpost members:', error);
    return [];
  }
}

/**
 * Create a new membership (invite user to outpost)
 */
export async function createMembership(
  outpostId: string,
  userId: string,
  role: Role
) {
  // Check if current user has permission
  const canManage = await canUserPerform('manage_members', outpostId);
  if (!canManage) {
    throw new Error('Insufficient permissions to manage members');
  }

  try {
    return await pb.collection('memberships').create({
      outpost: outpostId,
      user: userId,
      role,
    });
  } catch (error: any) {
    if (error.data?.data?.outpost?.message?.includes('unique')) {
      throw new Error('User is already a member of this outpost');
    }
    throw error;
  }
}

/**
 * Update a user's role in an outpost
 */
export async function updateMemberRole(
  membershipId: string,
  newRole: Role,
  outpostId: string
) {
  // Check if current user has permission
  const canManage = await canUserPerform('manage_members', outpostId);
  if (!canManage) {
    throw new Error('Insufficient permissions to manage members');
  }

  try {
    return await pb.collection('memberships').update(membershipId, {
      role: newRole,
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

/**
 * Remove a member from an outpost
 */
export async function removeMember(membershipId: string, outpostId: string) {
  // Check if current user has permission
  const canManage = await canUserPerform('manage_members', outpostId);
  if (!canManage) {
    throw new Error('Insufficient permissions to manage members');
  }

  try {
    await pb.collection('memberships').delete(membershipId);
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
}

/**
 * Initialize outpost context on app load
 * Sets the first available outpost as current if none is selected
 */
export async function initializeOutpostContext() {
  const currentOutpostId = getCurrentOutpostId();
  
  // If we have a current outpost, verify it's still valid
  if (currentOutpostId) {
    try {
      await pb.collection('outposts').getOne(currentOutpostId);
      return currentOutpostId;
    } catch {
      // Current outpost is invalid, clear it
      clearCurrentOutpost();
    }
  }

  // Get user's outposts and set the first one as current
  const outposts = await getUserOutposts();
  if (outposts.length > 0) {
    setCurrentOutpost(outposts[0].id);
    return outposts[0].id;
  }

  return null;
}

