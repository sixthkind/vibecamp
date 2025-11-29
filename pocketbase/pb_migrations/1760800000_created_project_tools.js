/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))",
    "deleteRule": "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))",
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
        "hidden": false,
        "id": "select_tool_type",
        "maxSelect": 1,
        "name": "tool_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "chat",
          "docs",
          "tasks",
          "schedule",
          "files",
          "board"
        ]
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
        "hidden": false,
        "id": "bool_active",
        "name": "active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "json_settings",
        "maxSize": 0,
        "name": "settings",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
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
    "id": "project_tools_collection",
    "indexes": [
      "CREATE UNIQUE INDEX idx_unique_project_tool_type ON project_tools (project, tool_type)",
      "CREATE INDEX idx_project_tools_project ON project_tools (project)",
      "CREATE INDEX idx_project_tools_active ON project_tools (active)"
    ],
    "listRule": "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project.outpost.id || @request.auth.project_memberships_via_user.project ?= project.id)",
    "name": "project_tools",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))",
    "viewRule": "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project.outpost.id || @request.auth.project_memberships_via_user.project ?= project.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("project_tools_collection");

  return app.delete(collection);
});

