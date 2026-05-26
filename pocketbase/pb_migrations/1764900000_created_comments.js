/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const memberAccessRule = "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || project.outpost.members.id ?= @request.auth.id)";
  const authorOrOwnerRule = "@request.auth.id != \"\" && (created_by.id = @request.auth.id || project.outpost.owner.id = @request.auth.id)";

  const collection = new Collection({
    "createRule": `${memberAccessRule} && created_by.id = @request.auth.id`,
    "deleteRule": authorOrOwnerRule,
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
        "collectionId": "projects_collection",
        "hidden": false,
        "id": "relation_project",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "project",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_target_collection",
        "max": 100,
        "min": 1,
        "name": "target_collection",
        "pattern": "^[a-zA-Z0-9_]+$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_target_id",
        "max": 15,
        "min": 15,
        "name": "target_id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_content",
        "max": 5000,
        "min": 1,
        "name": "content",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_created_by",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "created_by",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
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
    "id": "comments_collection",
    "indexes": [
      "CREATE INDEX idx_comments_project_target ON comments (project, target_collection, target_id)",
      "CREATE INDEX idx_comments_created ON comments (created)",
      "CREATE INDEX idx_comments_created_by ON comments (created_by)"
    ],
    "listRule": memberAccessRule,
    "name": "comments",
    "system": false,
    "type": "base",
    "updateRule": authorOrOwnerRule,
    "viewRule": memberAccessRule
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("comments_collection");

  return app.delete(collection);
});
