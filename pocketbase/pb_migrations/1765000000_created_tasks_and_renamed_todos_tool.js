/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const projectTools = app.findCollectionByNameOrId("project_tools_collection");
  const toolTypeField = projectTools.fields.getByName("tool_type");
  toolTypeField.values = [
    "chat",
    "docs",
    "todos",
    "tasks",
    "schedule",
    "files",
    "board",
  ];
  app.save(projectTools);

  const todoTools = app.findRecordsByFilter("project_tools", "tool_type = 'tasks'", "", 0, 0);
  for (const tool of todoTools) {
    tool.set("tool_type", "todos");
    app.save(tool);
  }

  const comments = app.findCollectionByNameOrId("comments_collection");
  comments.fields.add(new SelectField({
    id: "select_comment_kind",
    name: "kind",
    values: ["user", "system"],
    maxSelect: 1,
    required: false,
    hidden: false,
    presentable: false,
    system: false,
  }));
  app.save(comments);

  const commentRecords = app.findRecordsByFilter("comments", "", "", 0, 0);
  for (const comment of commentRecords) {
    if (!comment.getString("kind")) {
      comment.set("kind", "user");
      app.save(comment);
    }
  }

  const columnRules = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";
  const taskRules = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";

  const taskColumns = new Collection({
    "createRule": columnRules,
    "deleteRule": columnRules,
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
        "id": "text_color",
        "max": 32,
        "min": 1,
        "name": "color",
        "pattern": "^#[0-9A-Fa-f]{6}$",
        "presentable": false,
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
    "id": "task_columns_collection",
    "indexes": [
      "CREATE INDEX idx_task_columns_project_tool ON task_columns (project_tool)",
      "CREATE INDEX idx_task_columns_archived ON task_columns (archived)",
      "CREATE INDEX idx_task_columns_position ON task_columns (position)"
    ],
    "listRule": columnRules,
    "name": "task_columns",
    "system": false,
    "type": "base",
    "updateRule": columnRules,
    "viewRule": columnRules
  });
  app.save(taskColumns);

  const tasks = new Collection({
    "createRule": taskRules,
    "deleteRule": taskRules,
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
        "collectionId": "task_columns_collection",
        "hidden": false,
        "id": "relation_column",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "column",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_title",
        "max": 500,
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_description",
        "max": 5000,
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
    "id": "tasks_collection",
    "indexes": [
      "CREATE INDEX idx_tasks_project_tool ON tasks (project_tool)",
      "CREATE INDEX idx_tasks_column ON tasks (column)",
      "CREATE INDEX idx_tasks_archived ON tasks (archived)",
      "CREATE INDEX idx_tasks_position ON tasks (position)"
    ],
    "listRule": taskRules,
    "name": "tasks",
    "system": false,
    "type": "base",
    "updateRule": taskRules,
    "viewRule": taskRules
  });
  app.save(tasks);
}, (app) => {
  const tasks = app.findCollectionByNameOrId("tasks_collection");
  if (tasks) {
    app.delete(tasks);
  }

  const taskColumns = app.findCollectionByNameOrId("task_columns_collection");
  if (taskColumns) {
    app.delete(taskColumns);
  }

  const projectTools = app.findCollectionByNameOrId("project_tools_collection");
  const todoTools = app.findRecordsByFilter("project_tools", "tool_type = 'todos'", "", 0, 0);
  for (const tool of todoTools) {
    tool.set("tool_type", "tasks");
    app.save(tool);
  }

  const toolTypeField = projectTools.fields.getByName("tool_type");
  toolTypeField.values = [
    "chat",
    "docs",
    "tasks",
    "schedule",
    "files",
    "board",
  ];
  app.save(projectTools);

  const comments = app.findCollectionByNameOrId("comments_collection");
  if (comments) {
    comments.fields.removeByName("kind");
    app.save(comments);
  }
});
