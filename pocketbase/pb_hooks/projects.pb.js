/// <reference path="../pb_data/types.d.ts" />

// Hook to automatically create a chat tool when a project is created
onRecordAfterCreateSuccess((e) => {
  const record = e.record;
  
  try {
    // Create the default chat tool for the project
    const chatTool = new Record();
    chatTool.set("project", record.id);
    chatTool.set("tool_type", "chat");
    chatTool.set("name", "Chat");
    chatTool.set("active", true);
    chatTool.set("settings", {});
    
    $app.save(chatTool, $app.findCollectionByNameOrId("project_tools"));
  } catch (error) {
    console.error("Error creating default chat tool for project:", error);
    // Don't fail the project creation if tool creation fails
  }
}, "projects");

