/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const records = app.findRecordsByFilter(
    "project_tools",
    'tool_type = "todos" && name = "To-dos"',
    "",
    0,
    0
  );

  for (const record of records) {
    record.set("name", "ToDos");
    app.save(record);
  }
}, (app) => {
  const records = app.findRecordsByFilter(
    "project_tools",
    'tool_type = "todos" && name = "ToDos"',
    "",
    0,
    0
  );

  for (const record of records) {
    record.set("name", "To-dos");
    app.save(record);
  }
});
