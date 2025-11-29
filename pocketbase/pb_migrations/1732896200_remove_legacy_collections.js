/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Delete legacy collections: items, tags, clients
  try {
    const itemsCollection = app.findCollectionByNameOrId("pbc_710432678");
    if (itemsCollection) {
      app.delete(itemsCollection);
    }
  } catch (e) {
    console.log("Items collection not found or already deleted");
  }

  try {
    const tagsCollection = app.findCollectionByNameOrId("pbc_1219621782");
    if (tagsCollection) {
      app.delete(tagsCollection);
    }
  } catch (e) {
    console.log("Tags collection not found or already deleted");
  }

  try {
    const clientsCollection = app.findCollectionByNameOrId("pbc_2442875294");
    if (clientsCollection) {
      app.delete(clientsCollection);
    }
  } catch (e) {
    console.log("Clients collection not found or already deleted");
  }
}, (app) => {
  // Rollback not implemented as we're removing legacy data
  console.log("Rollback not available for legacy collection removal");
});

