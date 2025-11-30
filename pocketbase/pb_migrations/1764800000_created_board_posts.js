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
        "id": "text_title",
        "max": 255,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "convertUrls": false,
        "hidden": false,
        "id": "editor_content",
        "maxSize": 5242880,
        "name": "content",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
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
        "id": "bool_pinned",
        "name": "pinned",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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
    "id": "board_posts_collection",
    "indexes": [
      "CREATE INDEX idx_board_posts_project_tool ON board_posts (project_tool)",
      "CREATE INDEX idx_board_posts_created_by ON board_posts (created_by)",
      "CREATE INDEX idx_board_posts_pinned ON board_posts (pinned)",
      "CREATE INDEX idx_board_posts_created ON board_posts (created)"
    ],
    "listRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "name": "board_posts",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("board_posts_collection");

  return app.delete(collection);
});
