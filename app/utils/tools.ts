import { pb } from './pb';
import { canRolePerformOnProject, canUserPerformOnProject, getRoleFromOutpost } from './permissions';

export interface ProjectTool {
  id: string;
  project: string;
  tool_type: 'chat' | 'docs' | 'todos' | 'tasks' | 'schedule' | 'board';
  name: string;
  active: boolean;
  settings: Record<string, any>;
  position?: number;
  created: string;
  updated: string;
}

const projectToolPageRequests = new Map<string, Promise<any>>();
const projectToolPageCache = new Map<string, any>();

export async function getProjectWithToolPageData(projectId: string) {
  const cached = projectToolPageCache.get(projectId);
  if (cached) return cached;

  const pending = projectToolPageRequests.get(projectId);
  if (pending) return pending;

  const request = pb.collection('projects').getOne(projectId, {
    expand: 'outpost,project_tools_via_project',
  })
    .then((project) => {
      projectToolPageCache.set(projectId, project);
      return project;
    })
    .finally(() => {
      projectToolPageRequests.delete(projectId);
    });

  projectToolPageRequests.set(projectId, request);
  return request;
}

export function clearProjectWithToolPageDataCache(projectId?: string) {
  if (projectId) {
    projectToolPageCache.delete(projectId);
    projectToolPageRequests.delete(projectId);
  } else {
    projectToolPageCache.clear();
    projectToolPageRequests.clear();
  }
}

/**
 * Get all tools for a project
 */
export async function getProjectTools(projectId: string): Promise<ProjectTool[]> {
  try {
    const tools = await pb.collection('project_tools').getFullList<ProjectTool>({
      filter: `project = "${projectId}"`,
      sort: 'created',
    });
    return tools.sort((a, b) => (a.position || 0) - (b.position || 0));
  } catch (error) {
    console.error('Error fetching project tools:', error);
    return [];
  }
}

/**
 * Get active tools for a project
 */
export async function getActiveProjectTools(projectId: string): Promise<ProjectTool[]> {
  try {
    const tools = await pb.collection('project_tools').getFullList<ProjectTool>({
      filter: `project = "${projectId}" && active = true`,
      sort: 'created',
    });
    return tools.sort((a, b) => (a.position || 0) - (b.position || 0));
    return tools;
  } catch (error) {
    console.error('Error fetching active project tools:', error);
    return [];
  }
}

/**
 * Get a specific tool for a project by tool type
 */
export async function getProjectTool(projectId: string, toolType: string): Promise<ProjectTool | null> {
  try {
    const tools = await pb.collection('project_tools').getFullList<ProjectTool>({
      filter: `project = "${projectId}" && tool_type = "${toolType}"`,
    });
    return tools.length > 0 ? tools[0] : null;
  } catch (error) {
    console.error('Error fetching project tool:', error);
    return null;
  }
}

/**
 * Get an active tool for a project by tool type
 */
export async function getActiveTool(projectId: string, toolType: string): Promise<ProjectTool | null> {
  try {
    const tools = await pb.collection('project_tools').getFullList<ProjectTool>({
      filter: `project = "${projectId}" && tool_type = "${toolType}" && active = true`,
    });
    return tools.length > 0 ? tools[0] : null;
  } catch (error) {
    console.error('Error fetching active tool:', error);
    return null;
  }
}

/**
 * Load the common project/tool shell for a tool page in a single request.
 */
export async function getProjectToolPageData(projectId: string, toolType: string) {
  const project = await getProjectWithToolPageData(projectId);

  const expandedTools = project.expand?.project_tools_via_project;
  const tools = Array.isArray(expandedTools) ? expandedTools : [];
  const outpost = project.expand?.outpost;
  const role = getRoleFromOutpost(outpost);

  return {
    project,
    outpost,
    tool: tools.find((tool: ProjectTool) => tool.tool_type === toolType && tool.active) || null,
    canManage: canRolePerformOnProject('manage_settings', role),
  };
}

/**
 * Create a new tool for a project
 */
export async function createProjectTool(
  projectId: string,
  toolType: string,
  name: string,
  active: boolean = true,
  settings: Record<string, any> = {}
): Promise<ProjectTool | null> {
  try {
    const tool = await pb.collection('project_tools').create<ProjectTool>({
      project: projectId,
      tool_type: toolType,
      name,
      active,
      settings,
    });
    return tool;
  } catch (error) {
    console.error('Error creating project tool:', error);
    return null;
  }
}

/**
 * Update a project tool
 */
export async function updateProjectTool(
  toolId: string,
  data: Partial<Omit<ProjectTool, 'id' | 'project' | 'created' | 'updated'>>
): Promise<ProjectTool | null> {
  try {
    const tool = await pb.collection('project_tools').update<ProjectTool>(toolId, data);
    return tool;
  } catch (error) {
    console.error('Error updating project tool:', error);
    return null;
  }
}

/**
 * Toggle a tool's active status
 */
export async function toggleToolActive(toolId: string, active: boolean): Promise<boolean> {
  try {
    await pb.collection('project_tools').update(toolId, { active });
    return true;
  } catch (error) {
    console.error('Error toggling tool active status:', error);
    return false;
  }
}

/**
 * Delete a project tool
 */
export async function deleteProjectTool(toolId: string): Promise<boolean> {
  try {
    await pb.collection('project_tools').delete(toolId);
    return true;
  } catch (error) {
    console.error('Error deleting project tool:', error);
    return false;
  }
}

/**
 * Check if the current user can manage tools for a project
 */
export async function canUserManageTool(projectId: string): Promise<boolean> {
  return await canUserPerformOnProject('manage_settings', projectId);
}

/**
 * Get tool icon name for display
 */
export function getToolIcon(toolType: string): string {
  const icons: Record<string, string> = {
    chat: 'lucide:message-square',
    docs: 'lucide:folder-open',
    todos: 'lucide:check-square',
    tasks: 'lucide:columns-3',
    schedule: 'lucide:calendar',
    board: 'lucide:message-circle',
  };
  return icons[toolType] || 'lucide:tool';
}

/**
 * Get tool description
 */
export function getToolDescription(toolType: string): string {
  const descriptions: Record<string, string> = {
    chat: 'Real-time group chat for project communication',
    docs: 'Shared documents and file storage',
    todos: 'Task lists and to-do items',
    tasks: 'Kanban board for tracking work across columns',
    schedule: 'Project calendar and event scheduling',
    board: 'Message board for announcements and updates',
  };
  return descriptions[toolType] || 'Project collaboration tool';
}
