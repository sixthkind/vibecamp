/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("project_tools");

  if (!collection) {
    console.log("project_tools collection not found");
    return;
  }

  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number_position",
    "max": null,
    "min": null,
    "name": "position",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }));

  collection.indexes = [
    "CREATE UNIQUE INDEX idx_unique_project_tool_type ON project_tools (project, tool_type)",
    "CREATE INDEX idx_project_tools_project ON project_tools (project)",
    "CREATE INDEX idx_project_tools_active ON project_tools (active)",
    "CREATE INDEX idx_project_tools_position ON project_tools (position)"
  ];

  app.save(collection);

  const records = app.findRecordsByFilter(
    "project_tools",
    "active = true",
    "created",
    0,
    0
  );

  for (let i = 0; i < records.length; i++) {
    records[i].set("position", i + 1);
    app.save(records[i]);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("project_tools");

  if (!collection) {
    return;
  }

  collection.fields.removeById("number_position");

  collection.indexes = [
    "CREATE UNIQUE INDEX idx_unique_project_tool_type ON project_tools (project, tool_type)",
    "CREATE INDEX idx_project_tools_project ON project_tools (project)",
    "CREATE INDEX idx_project_tools_active ON project_tools (active)"
  ];

  return app.save(collection);
});
