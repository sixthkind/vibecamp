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
    "id": "project_memberships_collection",
    "indexes": [
      "CREATE UNIQUE INDEX idx_unique_user_project ON project_memberships (user, project)",
      "CREATE INDEX idx_project_memberships_user ON project_memberships (user)",
      "CREATE INDEX idx_project_memberships_project ON project_memberships (project)"
    ],
    "listRule": "@request.auth.id != \"\" && (user.id = @request.auth.id || project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))",
    "name": "project_memberships",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))",
    "viewRule": "@request.auth.id != \"\" && (user.id = @request.auth.id || project.outpost.owner.id = @request.auth.id || (@request.auth.memberships_via_user.outpost ?= project.outpost.id && (@request.auth.memberships_via_user.role ?= \"admin\" || @request.auth.memberships_via_user.role ?= \"owner\")) || (@request.auth.project_memberships_via_user.project ?= project.id && (@request.auth.project_memberships_via_user.role ?= \"admin\" || @request.auth.project_memberships_via_user.role ?= \"owner\")))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("project_memberships_collection");

  return app.delete(collection);
});

