/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  const { validateCommentTarget } = require(`${__hooks}/utils/comments.js`);

  if (e.auth && !e.hasSuperuserAuth()) {
    e.record.set("created_by", e.auth.id);
  }

  validateCommentTarget($app, e.record);

  return e.next();
}, "comments");

onRecordUpdateRequest((e) => {
  const { validateCommentTarget } = require(`${__hooks}/utils/comments.js`);
  const original = e.record.original();
  const immutableFields = ["project", "target_collection", "target_id", "created_by"];

  for (const field of immutableFields) {
    if (e.record.getString(field) !== original.getString(field)) {
      throw new BadRequestError("Comment target fields cannot be changed.", {
        [field]: new ValidationError("immutable", "This field cannot be changed after the comment is created."),
      });
    }
  }

  validateCommentTarget($app, e.record);

  return e.next();
}, "comments");

onRecordAfterDeleteSuccess((e) => {
  const { deleteCommentsForTarget } = require(`${__hooks}/utils/comments.js`);

  deleteCommentsForTarget($app, "board_posts", e.record.id);

  return e.next();
}, "board_posts");

onRecordAfterDeleteSuccess((e) => {
  const { deleteCommentsForTarget } = require(`${__hooks}/utils/comments.js`);

  deleteCommentsForTarget($app, "docs_items", e.record.id);

  return e.next();
}, "docs_items");

onRecordAfterDeleteSuccess((e) => {
  const { deleteCommentsForTarget } = require(`${__hooks}/utils/comments.js`);

  deleteCommentsForTarget($app, "calendar_events", e.record.id);

  return e.next();
}, "calendar_events");
