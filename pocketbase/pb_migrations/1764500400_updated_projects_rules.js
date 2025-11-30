/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("projects_collection");
  
  if (!collection) {
    console.log("projects collection not found");
    return;
  }

  // Update rules to use outpost membership instead of project_memberships
  collection.listRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= outpost.id)";
  collection.updateRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= outpost.id && @request.auth.memberships_via_user.role ?= \"admin\"))";
  collection.viewRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= outpost.id)";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("projects_collection");
  
  if (!collection) {
    return;
  }

  // Revert to old rules
  collection.listRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= outpost.id || @request.auth.project_memberships_via_user.project ?= id)";
  collection.updateRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= outpost.id && @request.auth.memberships_via_user.role ?= \"admin\") || (@request.auth.project_memberships_via_user.project ?= id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))";
  collection.viewRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= outpost.id || @request.auth.project_memberships_via_user.project ?= id)";

  return app.save(collection);
});


