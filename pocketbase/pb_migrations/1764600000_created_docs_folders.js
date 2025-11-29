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
    "id": "docs_folders_collection",
    "indexes": [
      "CREATE INDEX idx_docs_folders_project_tool ON docs_folders (project_tool)",
      "CREATE INDEX idx_docs_folders_position ON docs_folders (position)"
    ],
    "listRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "name": "docs_folders",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("docs_folders_collection");

  return app.delete(collection);
});

