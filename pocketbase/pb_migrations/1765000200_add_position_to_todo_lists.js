/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");

  if (!collection) {
    console.log("todo_lists collection not found");
    return;
  }

  collection.fields.addAt(5, new Field({
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
    "CREATE INDEX idx_todo_lists_project_tool ON todo_lists (project_tool)",
    "CREATE INDEX idx_todo_lists_archived ON todo_lists (archived)",
    "CREATE INDEX idx_todo_lists_created ON todo_lists (created)",
    "CREATE INDEX idx_todo_lists_position ON todo_lists (position)"
  ];

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");

  if (!collection) {
    return;
  }

  collection.fields.removeById("number_position");

  collection.indexes = [
    "CREATE INDEX idx_todo_lists_project_tool ON todo_lists (project_tool)",
    "CREATE INDEX idx_todo_lists_archived ON todo_lists (archived)",
    "CREATE INDEX idx_todo_lists_created ON todo_lists (created)"
  ];

  return app.save(collection);
});
