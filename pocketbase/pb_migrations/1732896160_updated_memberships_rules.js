/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Update memberships collection rules to include admin access
  // This migration runs after both collections exist
  const collection = app.findCollectionByNameOrId("memberships_collection");

  // Update rules to include admin checks via back relation
  collection.listRule = "@request.auth.id != \"\" && (user.id = @request.auth.id || outpost.owner.id = @request.auth.id || (outpost.memberships_via_outpost.user.id ?= @request.auth.id && outpost.memberships_via_outpost.role ?= 'admin'))";
  collection.viewRule = "@request.auth.id != \"\" && (user.id = @request.auth.id || outpost.owner.id = @request.auth.id || (outpost.memberships_via_outpost.user.id ?= @request.auth.id && outpost.memberships_via_outpost.role ?= 'admin'))";
  collection.createRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || (outpost.memberships_via_outpost.user.id ?= @request.auth.id && outpost.memberships_via_outpost.role ?= 'admin'))";
  collection.updateRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || (outpost.memberships_via_outpost.user.id ?= @request.auth.id && outpost.memberships_via_outpost.role ?= 'admin'))";
  collection.deleteRule = "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || (outpost.memberships_via_outpost.user.id ?= @request.auth.id && outpost.memberships_via_outpost.role ?= 'admin'))";

  return app.save(collection);
}, (app) => {
  // Rollback to simple owner-only rules
  const collection = app.findCollectionByNameOrId("memberships_collection");

  collection.listRule = "@request.auth.id != \"\" && (user.id = @request.auth.id || outpost.owner.id = @request.auth.id)";
  collection.viewRule = "@request.auth.id != \"\" && (user.id = @request.auth.id || outpost.owner.id = @request.auth.id)";
  collection.createRule = "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id";
  collection.updateRule = "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id";
  collection.deleteRule = "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id";

  return app.save(collection);
});

