/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("todo_items_collection");
  
  if (!collection) {
    console.log("todo_items collection not found");
    return;
  }

  // Update rules to use outpost membership instead of project_memberships
  collection.createRule = "@request.auth.id != \"\" && (todo_list.project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= todo_list.project_tool.project.outpost.id)";
  collection.deleteRule = "@request.auth.id != \"\" && (todo_list.project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= todo_list.project_tool.project.outpost.id)";
  collection.listRule = "@request.auth.id != \"\" && (todo_list.project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= todo_list.project_tool.project.outpost.id)";
  collection.updateRule = "@request.auth.id != \"\" && (todo_list.project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= todo_list.project_tool.project.outpost.id)";
  collection.viewRule = "@request.auth.id != \"\" && (todo_list.project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= todo_list.project_tool.project.outpost.id)";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("todo_items_collection");
  
  if (!collection) {
    return;
  }

  // Revert to old rules
  collection.createRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)";
  collection.deleteRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)";
  collection.listRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)";
  collection.updateRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)";
  collection.viewRule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)";

  return app.save(collection);
});


