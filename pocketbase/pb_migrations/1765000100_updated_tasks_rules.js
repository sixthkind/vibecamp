/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const rule = "@request.auth.id != \"\" && (project_tool.project.outpost.owner.id = @request.auth.id || @request.auth.memberships_via_user.outpost ?= project_tool.project.outpost.id)";

  const collections = [
    app.findCollectionByNameOrId("task_columns_collection"),
    app.findCollectionByNameOrId("tasks_collection"),
  ];

  for (const collection of collections) {
    if (!collection) continue;

    collection.createRule = rule;
    collection.deleteRule = rule;
    collection.listRule = rule;
    collection.updateRule = rule;
    collection.viewRule = rule;
    app.save(collection);
  }
}, (app) => {
  const rule = "@request.auth.id != \"\" && (@request.auth.project_memberships_via_user.project ?= project_tool.project.id)";

  const collections = [
    app.findCollectionByNameOrId("task_columns_collection"),
    app.findCollectionByNameOrId("tasks_collection"),
  ];

  for (const collection of collections) {
    if (!collection) continue;

    collection.createRule = rule;
    collection.deleteRule = rule;
    collection.listRule = rule;
    collection.updateRule = rule;
    collection.viewRule = rule;
    app.save(collection);
  }
});
