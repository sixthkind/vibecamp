/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Get the outposts collection
  const outposts = app.findCollectionByNameOrId("outposts");
  
  // Add members field as a multi-relation to users
  outposts.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation_members",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "members",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));
  
  // Update rules to allow owner to manage members
  // Owner can view, edit their outpost and manage members
  outposts.updateRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";
  outposts.viewRule = "@request.auth.id != \"\" && (owner.id = @request.auth.id || members.id ?= @request.auth.id)";
  outposts.listRule = "@request.auth.id != \"\" && (owner.id = @request.auth.id || members.id ?= @request.auth.id)";
  
  app.save(outposts);
  
  return null;
}, (app) => {
  // Rollback: remove members field
  const outposts = app.findCollectionByNameOrId("outposts");
  
  outposts.fields.removeById("relation_members");
  
  // Restore old rules
  outposts.updateRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";
  outposts.viewRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";
  outposts.listRule = "@request.auth.id != \"\" && owner.id = @request.auth.id";
  
  app.save(outposts);
  
  return null;
});

