/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");
  
  if (!collection) {
    console.log("todo_lists collection not found");
    return;
  }

  // Update rules to use outpost membership instead of project_memberships
  collection.createRule = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";
  collection.deleteRule = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";
  collection.listRule = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";
  collection.updateRule = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";
  collection.viewRule = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");
  
  if (!collection) {
    return;
  }

  // Revert to old rules
  collection.createRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)";
  collection.deleteRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)";
  collection.listRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)";
  collection.updateRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)";
  collection.viewRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)";

  return app.save(collection);
});


