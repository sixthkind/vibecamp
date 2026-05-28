/// <reference path="../pb_data/types.d.ts" />

const COMMENT_TARGETS = {
  board_posts: {
    getProjectId(app, targetId) {
      const record = app.findRecordById("board_posts", targetId);
      const tool = app.findRecordById("project_tools", record.getString("project_tool"));
      return tool.getString("project");
    },
  },
  docs_items: {
    getProjectId(app, targetId) {
      const record = app.findRecordById("docs_items", targetId);
      const tool = app.findRecordById("project_tools", record.getString("project_tool"));
      return tool.getString("project");
    },
  },
  calendar_events: {
    getProjectId(app, targetId) {
      const record = app.findRecordById("calendar_events", targetId);
      const tool = app.findRecordById("project_tools", record.getString("project_tool"));
      return tool.getString("project");
    },
  },
  todo_items: {
    getProjectId(app, targetId) {
      const record = app.findRecordById("todo_items", targetId);
      const list = app.findRecordById("todo_lists", record.getString("todo_list"));
      const tool = app.findRecordById("project_tools", list.getString("project_tool"));
      return tool.getString("project");
    },
  },
};

function getCommentTargetProjectId(app, targetCollection, targetId) {
  const target = COMMENT_TARGETS[targetCollection];

  if (!target) {
    throw new BadRequestError("Unsupported comment target.", {
      target_collection: new ValidationError("unsupported_target", "Comments are not supported for this target type."),
    });
  }

  try {
    return target.getProjectId(app, targetId);
  } catch (error) {
    throw new BadRequestError("Comment target was not found.", {
      target_id: new ValidationError("missing_target", "The comment target does not exist."),
    });
  }
}

function validateCommentTarget(app, comment) {
  const projectId = comment.getString("project");
  const targetCollection = comment.getString("target_collection");
  const targetId = comment.getString("target_id");
  const targetProjectId = getCommentTargetProjectId(app, targetCollection, targetId);

  if (projectId !== targetProjectId) {
    throw new BadRequestError("Comment target does not belong to the provided project.", {
      project: new ValidationError("project_mismatch", "The comment target belongs to a different project."),
    });
  }
}

function deleteCommentsForTarget(app, targetCollection, targetId) {
  while (true) {
    const comments = app.findRecordsByFilter(
      "comments",
      "target_collection = {:targetCollection} && target_id = {:targetId}",
      "",
      200,
      0,
      { targetCollection, targetId },
    );

    if (!comments.length) {
      return;
    }

    for (const comment of comments) {
      app.delete(comment);
    }
  }
}

onRecordCreateRequest((e) => {
  if (e.auth && !e.hasSuperuserAuth()) {
    e.record.set("created_by", e.auth.id);
  }

  validateCommentTarget($app, e.record);

  return e.next();
}, "comments");

onRecordUpdateRequest((e) => {
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
  deleteCommentsForTarget($app, "board_posts", e.record.id);

  return e.next();
}, "board_posts");

onRecordAfterDeleteSuccess((e) => {
  deleteCommentsForTarget($app, "docs_items", e.record.id);

  return e.next();
}, "docs_items");

onRecordAfterDeleteSuccess((e) => {
  deleteCommentsForTarget($app, "calendar_events", e.record.id);

  return e.next();
}, "calendar_events");

onRecordAfterDeleteSuccess((e) => {
  deleteCommentsForTarget($app, "todo_items", e.record.id);

  return e.next();
}, "todo_items");
