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

module.exports = {
  COMMENT_TARGETS,
  deleteCommentsForTarget,
  getCommentTargetProjectId,
  validateCommentTarget,
};
