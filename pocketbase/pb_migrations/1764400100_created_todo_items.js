/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)",
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
        "collectionId": "todo_lists_collection",
        "hidden": false,
        "id": "relation_todo_list",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "todo_list",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_content",
        "max": 500,
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_description",
        "max": 2000,
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
        "id": "bool_completed",
        "name": "completed",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_assignee",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assignee",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date_due_date",
        "max": "",
        "min": "",
        "name": "due_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number_position",
        "max": null,
        "min": 0,
        "name": "position",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
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
        "id": "date_completed_at",
        "max": "",
        "min": "",
        "name": "completed_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_completed_by",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "completed_by",
        "presentable": false,
        "required": false,
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
    "id": "todo_items_collection",
    "indexes": [
      "CREATE INDEX idx_todo_items_todo_list ON todo_items (todo_list)",
      "CREATE INDEX idx_todo_items_completed ON todo_items (completed)",
      "CREATE INDEX idx_todo_items_assignee ON todo_items (assignee)",
      "CREATE INDEX idx_todo_items_due_date ON todo_items (due_date)",
      "CREATE INDEX idx_todo_items_position ON todo_items (position)"
    ],
    "listRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)",
    "name": "todo_items",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= todo_list.project_tool.project.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("todo_items_collection");

  return app.delete(collection);
});

