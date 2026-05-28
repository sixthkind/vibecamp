/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("comments_collection");

  if (!collection) {
    console.log("comments collection not found");
    return;
  }

  collection.createRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || project.outpost.members.id ?= @request.auth.id || @request.auth.project_memberships_via_user.project ?= project.id)";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("comments_collection");

  if (!collection) {
    console.log("comments collection not found");
    return;
  }

  collection.createRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || project.outpost.members.id ?= @request.auth.id || @request.auth.project_memberships_via_user.project ?= project.id) && created_by.id = @request.auth.id";

  return app.save(collection);
});
