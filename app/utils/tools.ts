import { pb } from './pb';
import { canUserPerformOnProject } from './permissions';

export interface ProjectTool {
  id: string;
  project: string;
  tool_type: 'chat' | 'docs' | 'tasks' | 'schedule';
  name: string;
  active: boolean;
  settings: Record<string, any>;
  created: string;
  updated: string;
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
    return tools;
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
    tasks: 'lucide:check-square',
    schedule: 'lucide:calendar',
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
    tasks: 'Task lists and to-do items',
    schedule: 'Project calendar and event scheduling',
  };
  return descriptions[toolType] || 'Project collaboration tool';
}

