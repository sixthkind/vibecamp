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
        "cascadeDelete": true,
        "collectionId": "docs_folders_collection",
        "hidden": false,
        "id": "relation_folder",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "folder",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select_type",
        "maxSelect": 1,
        "name": "type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "document",
          "file"
        ]
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
        "hidden": false,
        "id": "file_file",
        "maxSelect": 1,
        "maxSize": 20971520,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
          "text/csv",
          "text/rtf",
          "application/zip",
          "application/x-rar-compressed"
        ],
        "name": "file",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [
          "100x100",
          "300x300"
        ],
        "type": "file"
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
    "id": "docs_items_collection",
    "indexes": [
      "CREATE INDEX idx_docs_items_project_tool ON docs_items (project_tool)",
      "CREATE INDEX idx_docs_items_folder ON docs_items (folder)",
      "CREATE INDEX idx_docs_items_type ON docs_items (type)",
      "CREATE INDEX idx_docs_items_created_by ON docs_items (created_by)",
      "CREATE INDEX idx_docs_items_position ON docs_items (position)",
      "CREATE INDEX idx_docs_items_created ON docs_items (created)"
    ],
    "listRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "name": "docs_items",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("docs_items_collection");

  return app.delete(collection);
});

