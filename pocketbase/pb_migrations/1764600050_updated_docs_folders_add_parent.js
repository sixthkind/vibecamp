/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("docs_folders_collection");

  // Add parent field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "docs_folders_collection",
    "hidden": false,
    "id": "relation_parent",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "parent",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));

  // Add parent index
  collection.indexes = [
    "CREATE INDEX idx_docs_folders_project_tool ON docs_folders (project_tool)",
    "CREATE INDEX idx_docs_folders_parent ON docs_folders (parent)",
    "CREATE INDEX idx_docs_folders_position ON docs_folders (position)"
  ];

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("docs_folders_collection");

  // Remove parent field
  collection.fields.removeById("relation_parent");

  // Remove parent index
  collection.indexes = [
    "CREATE INDEX idx_docs_folders_project_tool ON docs_folders (project_tool)",
    "CREATE INDEX idx_docs_folders_position ON docs_folders (position)"
  ];

  return app.save(collection);
});


