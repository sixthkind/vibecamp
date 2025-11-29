/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= outpost.id && @request.auth.memberships_via_user.role != \"viewer\")",
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
        "max": 0,
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
        "id": "select_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "active",
          "archived",
          "completed"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_color",
        "max": 7,
        "min": 0,
        "name": "color",
        "pattern": "^#[0-9A-Fa-f]{6}$|^$",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "file_avatar",
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/svg+xml",
          "image/gif",
          "image/webp"
        ],
        "name": "avatar",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [
          "100x100"
        ],
        "type": "file"
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
    "id": "projects_collection",
    "indexes": [
      "CREATE INDEX idx_projects_outpost ON projects (outpost)",
      "CREATE INDEX idx_projects_status ON projects (status)"
    ],
    "listRule": "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= outpost.id || @request.auth.project_memberships_via_user.project ?= id)",
    "name": "projects",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= outpost.id && @request.auth.memberships_via_user.role ?= \"admin\") || (@request.auth.project_memberships_via_user.project ?= id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))",
    "viewRule": "@request.auth.id != \"\" && (outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= outpost.id || @request.auth.project_memberships_via_user.project ?= id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("projects_collection");

  return app.delete(collection);
});

