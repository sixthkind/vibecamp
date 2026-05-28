/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  if (e.auth) {
    e.record.set("created_by", e.auth.id);
  }

  if (!e.record.getString("kind")) {
    e.record.setIfFieldExists("kind", "user");
  }

  return e.next();
}, "comments");

onRecordUpdateRequest((e) => {
  const original = e.record.original();
  const immutableFields = ["project", "target_collection", "target_id", "created_by", "kind"];

  for (const field of immutableFields) {
    if (e.record.getString(field) !== original.getString(field)) {
      throw new Error("Comment target fields cannot be changed.");
    }
  }

  return e.next();
}, "comments");
