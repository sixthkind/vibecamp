/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("comments_collection");

  if (!collection) {
    console.log("comments collection not found");
    return;
  }

  const memberAccessRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || project.outpost.members.id ?= @request.auth.id || @request.auth.project_memberships_via_user.project ?= project.id)";
  const authorOrOwnerRule = "@request.auth.id != \"\" && (created_by.id = @request.auth.id || project.outpost.owner.id = @request.auth.id || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))";

  collection.createRule = memberAccessRule;
  collection.deleteRule = authorOrOwnerRule;
  collection.listRule = memberAccessRule;
  collection.updateRule = authorOrOwnerRule;
  collection.viewRule = memberAccessRule;

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("comments_collection");

  if (!collection) {
    console.log("comments collection not found");
    return;
  }

  const memberAccessRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || project.outpost.members.id ?= @request.auth.id)";
  const authorOrOwnerRule = "@request.auth.id != \"\" && (created_by.id = @request.auth.id || project.outpost.owner.id = @request.auth.id)";

  collection.createRule = memberAccessRule;
  collection.deleteRule = authorOrOwnerRule;
  collection.listRule = memberAccessRule;
  collection.updateRule = authorOrOwnerRule;
  collection.viewRule = memberAccessRule;

  return app.save(collection);
});
