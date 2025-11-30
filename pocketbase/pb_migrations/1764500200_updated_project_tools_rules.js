/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("project_tools_collection");
  
  if (!collection) {
    console.log("project_tools collection not found");
    return;
  }

  // Update rules to use outpost membership instead of project_memberships
  collection.createRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")))";
  collection.deleteRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")))";
  collection.listRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project.outpost.id)";
  collection.updateRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")))";
  collection.viewRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project.outpost.id)";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("project_tools_collection");
  
  if (!collection) {
    return;
  }

  // Revert to old rules
  collection.createRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))";
  collection.deleteRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))";
  collection.listRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project.outpost.id || @request.auth.project_memberships_via_user.project ?= project.id)";
  collection.updateRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))";
  collection.viewRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project.outpost.id || @request.auth.project_memberships_via_user.project ?= project.id)";

  return app.save(collection);
});


