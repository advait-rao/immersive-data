import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  datasets: defineTable({
    ownerId: v.optional(v.string()),
    title: v.string(),
    source: v.union(v.literal("sample"), v.literal("upload")),
    columns: v.array(v.string()),
    rowCount: v.number(),
    createdAt: v.number(),
  }),

  chartConfigs: defineTable({
    datasetId: v.id("datasets"),
    title: v.string(),
    xColumn: v.string(),
    yColumn: v.string(),
    chartType: v.literal("line"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_dataset", ["datasetId"]),
});
