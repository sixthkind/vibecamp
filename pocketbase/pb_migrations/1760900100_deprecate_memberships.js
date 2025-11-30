/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Migrate existing memberships data to outposts.members
  const memberships = app.findRecordsByFilter("memberships", "", "-created", 9999);
  const outpostMemberMap = new Map();
  
  // Group members by outpost
  memberships.forEach(membership => {
    const outpostId = membership.get("outpost");
    const userId = membership.get("user");
    const role = membership.get("role");
    
    // Skip owner role - they're already the owner
    if (role === "owner") {
      return;
    }
    
    if (!outpostMemberMap.has(outpostId)) {
      outpostMemberMap.set(outpostId, []);
    }
    
    outpostMemberMap.get(outpostId).push(userId);
  });
  
  // Update each outpost with its members
  outpostMemberMap.forEach((memberIds, outpostId) => {
    try {
      const outpost = app.findRecordById("outposts", outpostId);
      outpost.set("members", memberIds);
      app.save(outpost);
      console.log(`Migrated ${memberIds.length} members to outpost ${outpostId}`);
    } catch (error) {
      console.error(`Error migrating members for outpost ${outpostId}:`, error);
    }
  });
  
  // Delete the memberships collection
  try {
    const membershipsCollection = app.findCollectionByNameOrId("memberships");
    app.delete(membershipsCollection);
    console.log("Successfully deleted memberships collection");
  } catch (error) {
    console.error("Error deleting memberships collection:", error);
  }
  
  return null;
}, (app) => {
  // Rollback: recreate memberships collection
  // Note: This won't restore the data, but will recreate the collection structure
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_user",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "outposts_collection",
        "hidden": false,
        "id": "relation_outpost",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "outpost",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select_role",
        "maxSelect": 1,
        "name": "role",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "owner",
          "admin",
          "member",
          "viewer"
        ]
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "memberships_collection",
    "indexes": [
      "CREATE UNIQUE INDEX idx_unique_user_outpost ON memberships (user, outpost)",
      "CREATE INDEX idx_memberships_user ON memberships (user)",
      "CREATE INDEX idx_memberships_outpost ON memberships (outpost)"
    ],
    "listRule": "@request.auth.id != \"\" && (user.id = @request.auth.id || outpost.owner.id = @request.auth.id)",
    "name": "memberships",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && (user.id = @request.auth.id || outpost.owner.id = @request.auth.id)"
  });
  
  app.save(collection);
  
  return null;
});


