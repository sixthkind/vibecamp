/// <reference path="../pb_data/types.d.ts" />

/**
 * Outpost and Membership Hooks
 * 
 * This file handles automatic membership creation when outposts are created,
 * and validates important operations like role changes and member removal.
 */

// Auto-create owner membership when an outpost is created
onRecordAfterCreateSuccess((e) => {
  const record = e.record;
  const ownerId = record.get("owner");

  console.log("Creating membership for outpost:", record.id, "owner:", ownerId);

  if (!ownerId) {
    console.error("Outpost has no owner!");
    throw new BadRequestError("Outpost must have an owner");
  }

  // Create a membership for the owner
  try {
    const membershipsCollection = $app.findCollectionByNameOrId("memberships");
    const membershipRecord = new Record(membershipsCollection);
    
    membershipRecord.set("user", ownerId);
    membershipRecord.set("outpost", record.id);
    membershipRecord.set("role", "owner");
    
    $app.save(membershipRecord);
    console.log("Successfully created owner membership");
  } catch (error) {
    console.error("Error creating membership:", error);
    // If membership already exists, that's fine
    if (!error.message.includes("unique")) {
      throw error;
    }
  }
}, "outposts");

// Prevent removing the last owner from an outpost
onRecordDelete((e) => {
  const record = e.record;
  const outpostId = record.get("outpost");
  const role = record.get("role");

  // If deleting an owner membership, check if there are other owners
  if (role === "owner") {
    const memberships = $app.findRecordsByFilter(
      "memberships",
      `outpost = "${outpostId}" && role = "owner" && id != "${record.id}"`,
      "-created",
      1
    );

    if (memberships.length === 0) {
      throw new BadRequestError("Cannot remove the last owner from an outpost");
    }
  }
}, "memberships");

// Prevent changing role of the last owner
onRecordUpdate((e) => {
  const record = e.record;
  const oldRole = record.originalCopy().get("role");
  const newRole = record.get("role");
  const outpostId = record.get("outpost");

  // If changing from owner to something else, check if there are other owners
  if (oldRole === "owner" && newRole !== "owner") {
    const otherOwners = $app.findRecordsByFilter(
      "memberships",
      `outpost = "${outpostId}" && role = "owner" && id != "${record.id}"`,
      "-created",
      1
    );

    if (otherOwners.length === 0) {
      throw new BadRequestError("Cannot change the role of the last owner. Promote another member to owner first.");
    }
  }
}, "memberships");

// Validate that users can't have duplicate memberships in the same outpost
// This is also enforced by the unique index, but we can provide a better error message
onRecordCreate((e) => {
  const record = e.record;
  const userId = record.get("user");
  const outpostId = record.get("outpost");

  const existingMemberships = $app.findRecordsByFilter(
    "memberships",
    `user = "${userId}" && outpost = "${outpostId}"`,
    "-created",
    1
  );

  if (existingMemberships.length > 0) {
    throw new BadRequestError("User is already a member of this outpost");
  }
}, "memberships");

