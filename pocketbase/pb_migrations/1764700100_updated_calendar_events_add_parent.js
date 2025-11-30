/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("calendar_events_collection");

  // Add parent_event relation field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "calendar_events_collection",
    "hidden": false,
    "id": "relation_parent_event",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "parent_event",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("calendar_events_collection");

  // Remove parent_event field
  collection.fields.removeById("relation_parent_event");

  return app.save(collection);
});

