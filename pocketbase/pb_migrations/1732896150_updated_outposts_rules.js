/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Update outposts collection rules to include membership-based access
  // This migration runs after both outposts and memberships collections exist
  const collection = app.findCollectionByNameOrId("outposts_collection");

  // Update rules to include membership checks
  collection.listRule = "@request.auth.id != \"\" && (owner.id = @request.auth.id || memberships_via_outpost.user.id ?= @request.auth.id)";
  collection.viewRule = "@request.auth.id != \"\" && (owner.id = @request.auth.id || memberships_via_outpost.user.id ?= @request.auth.id)";
  collection.updateRule = "@request.auth.id != \"\" && (owner.id = @request.auth.id || (memberships_via_outpost.user.id ?= @request.auth.id && memberships_via_outpost.role ?= 'admin'))";

  return app.save(collection);
}, (app) => {
  // Rollback to simple owner-only rules
  const collection = app.findCollectionByNameOrId("outposts_collection");

  collection.listRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";
  collection.viewRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";
  collection.updateRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";

  return app.save(collection);
});

