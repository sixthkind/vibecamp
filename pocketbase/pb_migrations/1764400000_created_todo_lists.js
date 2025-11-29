/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
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
        "collectionId": "project_tools_collection",
        "hidden": false,
        "id": "relation_project_tool",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "project_tool",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_name",
        "max": 255,
        "min": 1,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_description",
        "max": 1000,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool_archived",
        "name": "archived",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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
    "id": "todo_lists_collection",
    "indexes": [
      "CREATE INDEX idx_todo_lists_project_tool ON todo_lists (project_tool)",
      "CREATE INDEX idx_todo_lists_archived ON todo_lists (archived)",
      "CREATE INDEX idx_todo_lists_created ON todo_lists (created)"
    ],
    "listRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "name": "todo_lists",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");

  return app.delete(collection);
});

