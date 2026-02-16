
/**
 * Test Script for Data Layer
 * 
 * Usage: npx tsx scripts/test-data-layer.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

// Config env first
dotenv.config();

async function runTest() {
    console.log("🚀 Starting Data Layer Test...");

    // Dynamic imports to ensure env vars are loaded before db connection
    const { connectDB } = await import("../lib/db");
    const { createProject, getProjects, deleteProject } = await import("../services/project.service");
    const { createTask, getTasks, updateTask, addSubtask, toggleSubtask } = await import("../services/task.service");
    const { createNotification, getUserNotifications } = await import("../services/notification.service");

    try {
        await connectDB();
        console.log("✅ DB Connected");

        // 0. Setup Dummy User ID (using a fake ObjectId)
        const userId = new mongoose.Types.ObjectId().toString();
        console.log(`👤 Using Mock User ID: ${userId}`);

        // --- PROJECT TESTS ---
        console.log("\n--- 📁 PROJECT TESTS ---");

        // 1. Create Project
        const project = await createProject({
            name: "Test Project Beta",
            description: "A test project for verification",
            startDate: new Date().toISOString(),
            deadline: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
            tags: ["test", "beta"],
        }, userId);
        console.log(`✅ Created Project: ${project.name} (${project._id})`);

        // 2. Get Projects
        const projects = await getProjects({ search: "Test Project" });
        console.log(`✅ Found ${projects.length} projects matching 'Test Project'`);

        // --- TASK TESTS ---
        console.log("\n--- ✅ TASK TESTS ---");

        // 3. Create Task
        const task = await createTask({
            title: "Initial Setup Task",
            description: "Set up the environment",
            projectId: project._id.toString(),
            assigneeId: userId,
            priority: "high",
            deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
        } as any, userId);
        console.log(`✅ Created Task: ${task.title} (${task._id})`);

        // 4. Update Task
        const updatedTask = await updateTask(task._id.toString(), { status: "in_progress" } as any);
        console.log(`✅ Updated Task Status: ${updatedTask?.status}`);

        // 5. Add Subtask
        const taskWithSubtask = await addSubtask(task._id.toString(), "Install dependencies");
        const subtaskId = taskWithSubtask.subtasks[0]._id;
        console.log(`✅ Added Subtask: ${taskWithSubtask.subtasks[0].title}`);

        // 6. Toggle Subtask
        const taskWithToggledSubtask = await toggleSubtask(task._id.toString(), subtaskId.toString(), true);
        console.log(`✅ Toggled Subtask Done: ${taskWithToggledSubtask.subtasks[0].done}`);

        // --- NOTIFICATION TESTS ---
        console.log("\n--- 🔔 NOTIFICATION TESTS ---");

        // 7. Create Notification
        await createNotification({
            userId,
            type: "task_assigned",
            title: "New Task Assigned",
            message: `You have been assigned to ${task.title}`,
            metadata: {
                taskId: task._id.toString(),
                projectId: project._id.toString(),
            },
        });
        console.log("✅ Created Notification");

        // 8. Get Notifications
        const notifications = await getUserNotifications(userId);
        console.log(`✅ Fetched ${notifications.length} notifications for user`);

        // --- CLEANUP ---
        console.log("\n--- 🧹 CLEANUP ---");
        // await deleteProject(project._id); // Optional: keep for inspection
        // console.log("✅ Deleted Test Project");

        console.log("\n🎉 All Tests Passed Successfully!");
    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runTest();
