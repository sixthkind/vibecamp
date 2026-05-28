/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");

  if (!collection) {
    console.log("todo_lists collection not found");
    return;
  }

  collection.fields.addAt(4, new Field({
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
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("todo_lists_collection");

  if (!collection) {
    return;
  }

  collection.fields.removeById("text_color");

  return app.save(collection);
});
