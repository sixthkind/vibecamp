import { pb } from './pb';

// Simplified role system - only owner and member
export type Role = 'owner' | 'member';

// Actions that can be performed
export type Action = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'manage_members' 
  | 'manage_settings'
  | 'delete_outpost';

// Project-specific actions
export type ProjectAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'manage_members'
  | 'manage_settings'
  | 'archive'
  | 'delete_project';

// Permission matrix: only owner can manage members and settings
const PERMISSION_MATRIX: Record<Action, Role> = {
  view: 'member',
  create: 'member',
  edit: 'member',
  delete: 'member',
  manage_members: 'owner',
  manage_settings: 'owner',
  delete_outpost: 'owner',
};

// Project permission matrix
const PROJECT_PERMISSION_MATRIX: Record<ProjectAction, Role> = {
  view: 'member',
  create: 'member',
  edit: 'member',
  delete: 'member',
  manage_members: 'owner',
  manage_settings: 'owner',
  archive: 'owner',
  delete_project: 'owner',
};

/**
 * Get all outposts the current user belongs to
 */
export async function getUserOutposts() {
  const userId = pb.authStore.record?.id;
  if (!userId) return [];

  try {
    // Get outposts where user is owner or member
    const outposts = await pb.collection('outposts').getFullList({
      filter: `owner = "${userId}" || members.id ?= "${userId}"`,
      sort: '-created',
    });

    return outposts.map(outpost => ({
      ...outpost,
      userRole: outpost.owner === userId ? 'owner' : 'member' as Role,
    }));
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
    const outpost = await pb.collection('outposts').getOne(outpostId, {
      expand: 'members',
    });
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
    const outpost = await pb.collection('outposts').getOne(outpostId);
    
    // Check if user is the owner
    if (outpost.owner === userId) {
      return 'owner';
    }

    // Check if user is in members array
    if (outpost.members && outpost.members.includes(userId)) {
      return 'member';
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
  // Owner can do everything, members can do member-level actions
  return userRole === 'owner' || requiredRole === 'member';
}

/**
 * Check if a role has sufficient permissions compared to another role
 * In simplified system, owner always has higher role than member
 */
export function hasHigherRole(role1: Role, role2: Role): boolean {
  return role1 === 'owner' && role2 === 'member';
}

/**
 * Get all members of an outpost (requires owner)
 */
export async function getOutpostMembers(outpostId: string) {
  try {
    const outpost = await pb.collection('outposts').getOne(outpostId, {
      expand: 'members,owner',
    });

    const members = [];
    
    // Add owner first
    if (outpost.expand?.owner) {
      members.push({
        id: outpost.owner,
        userId: outpost.owner,
        role: 'owner' as Role,
        created: outpost.created,
        user: outpost.expand.owner,
      });
    } else {
      // Fallback: fetch owner manually
      try {
        const ownerUser = await pb.collection('users').getOne(outpost.owner);
        members.push({
          id: outpost.owner,
          userId: outpost.owner,
          role: 'owner' as Role,
          created: outpost.created,
          user: ownerUser,
        });
      } catch (err) {
        console.error('Failed to fetch owner:', err);
      }
    }

    // Add members
    if (outpost.members && Array.isArray(outpost.members) && outpost.members.length > 0) {
      // Check if we have expanded members
      if (outpost.expand?.members && Array.isArray(outpost.expand.members)) {
        outpost.expand.members.forEach((user: any) => {
          members.push({
            id: user.id,
            userId: user.id,
            role: 'member' as Role,
            created: user.created || outpost.created,
            user: user,
          });
        });
      } else {
        // Fallback: fetch members manually
        for (const memberId of outpost.members) {
          try {
            const memberUser = await pb.collection('users').getOne(memberId);
            members.push({
              id: memberUser.id,
              userId: memberUser.id,
              role: 'member' as Role,
              created: memberUser.created || outpost.created,
              user: memberUser,
            });
          } catch (err) {
            console.error('Failed to fetch member:', memberId, err);
          }
        }
      }
    }

    return members;
  } catch (error) {
    console.error('Error fetching outpost members:', error);
    return [];
  }
}

/**
 * Add a member to an outpost (owner only)
 */
export async function addMember(
  outpostId: string,
  userId: string
) {
  // Check if current user is owner
  const userRole = await getUserRole(outpostId);
  if (userRole !== 'owner') {
    throw new Error('Only the owner can add members');
  }

  try {
    // Get current outpost
    const outpost = await pb.collection('outposts').getOne(outpostId);
    
    // Check if user is already a member or owner
    if (outpost.owner === userId) {
      throw new Error('User is already the owner of this outpost');
    }
    
    const currentMembers = outpost.members || [];
    if (currentMembers.includes(userId)) {
      throw new Error('User is already a member of this outpost');
    }

    // Add user to members array
    const updatedMembers = [...currentMembers, userId];
    
    return await pb.collection('outposts').update(outpostId, {
      members: updatedMembers,
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    throw error;
  }
}

/**
 * Remove a member from an outpost (owner only)
 */
export async function removeMember(userId: string, outpostId: string) {
  // Check if current user is owner
  const userRole = await getUserRole(outpostId);
  if (userRole !== 'owner') {
    throw new Error('Only the owner can remove members');
  }

  try {
    // Get current outpost
    const outpost = await pb.collection('outposts').getOne(outpostId);
    
    // Can't remove the owner
    if (outpost.owner === userId) {
      throw new Error('Cannot remove the owner from the outpost');
    }

    // Remove user from members array
    const currentMembers = outpost.members || [];
    const updatedMembers = currentMembers.filter((id: string) => id !== userId);
    
    await pb.collection('outposts').update(outpostId, {
      members: updatedMembers,
    });
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

// ============================================================================
// PROJECT PERMISSIONS
// ============================================================================

/**
 * Get all projects the user can access in an outpost
 */
export async function getUserProjects(outpostId: string) {
  const userId = pb.authStore.record?.id;
  if (!userId) return [];

  try {
    // Get all projects in the outpost that the user has access to
    const projects = await pb.collection('projects').getFullList({
      filter: `outpost = "${outpostId}"`,
      sort: '-created',
    });

    // For each project, get the user's role (based on outpost role)
    const role = await getUserRole(outpostId);
    
    return projects.map(project => ({
      ...project,
      userRole: role,
    }));
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

/**
 * Get the user's role in a specific project
 * In simplified system, project permissions inherit from outpost
 */
export async function getProjectRole(projectId: string): Promise<Role | null> {
  const userId = pb.authStore.record?.id;
  if (!userId) return null;

  try {
    // Get the project with expanded outpost
    const project = await pb.collection('projects').getOne(projectId, {
      expand: 'outpost',
    });

    const outpost = project.expand?.outpost;
    if (!outpost) return null;

    // Return the user's role in the outpost
    return await getUserRole(outpost.id);
  } catch (error) {
    console.error('Error fetching project role:', error);
    return null;
  }
}

/**
 * Check if a user can perform a specific action on a project
 */
export async function canUserPerformOnProject(
  action: ProjectAction,
  projectId: string
): Promise<boolean> {
  const userId = pb.authStore.record?.id;
  if (!userId) return false;

  const userRole = await getProjectRole(projectId);
  if (!userRole) return false;

  const requiredRole = PROJECT_PERMISSION_MATRIX[action];
  // Owner can do everything, members can do member-level actions
  return userRole === 'owner' || requiredRole === 'member';
}

/**
 * Get all members of a project (same as outpost members)
 */
export async function getProjectMembers(projectId: string) {
  try {
    const project = await pb.collection('projects').getOne(projectId);
    return await getOutpostMembers(project.outpost);
  } catch (error) {
    console.error('Error fetching project members:', error);
    return [];
  }
}

/**
 * Create a new project membership (owner only)
 * Note: In simplified system, this adds them to the outpost
 */
export async function createProjectMembership(
  projectId: string,
  userId: string,
  role: Role
) {
  try {
    const project = await pb.collection('projects').getOne(projectId);
    return await addMember(project.outpost, userId);
  } catch (error: any) {
    console.error('Error adding project member:', error);
    throw error;
  }
}

/**
 * Remove a member from a project (owner only)
 * Note: In simplified system, this removes them from the outpost
 */
export async function removeProjectMember(userId: string, projectId: string) {
  try {
    const project = await pb.collection('projects').getOne(projectId);
    return await removeMember(userId, project.outpost);
  } catch (error) {
    console.error('Error removing project member:', error);
    throw error;
  }
}

// Legacy functions for backwards compatibility
export function updateMemberRole(membershipId: string, newRole: Role, outpostId: string) {
  throw new Error('Role updates are no longer supported. Only owner and member roles exist.');
}

export function updateProjectMemberRole(membershipId: string, newRole: Role, projectId: string) {
  throw new Error('Role updates are no longer supported. Only owner and member roles exist.');
}

// Deprecated - kept for backwards compatibility
export function createMembership(outpostId: string, userId: string, role: Role) {
  return addMember(outpostId, userId);
}
