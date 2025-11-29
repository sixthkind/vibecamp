async function getSchema(type: string) {
  let schema = schemas[type];
  return schema;
}

const schemas: any = {
  users: {
    name: { type: "text", label: "Name" },
    avatar: { type: "file", label: "Avatar", drop: true, "upload-temp-endpoint": false, "soft-remove": true }
  },
  outposts: {
    name: { type: "text", label: "Name" },
    description: { type: "textarea", label: "Description" },
    avatar: { type: "file", label: "Avatar", drop: true, "upload-temp-endpoint": false, "soft-remove": true }
  },
  notdeletable: ['users', 'outposts', 'memberships']
}

export { getSchema };