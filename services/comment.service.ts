import { connectDB } from "@/lib/db";
import { Comment, IComment } from "@/models/comment.model";
import "@/models/user.model"; // Register User schema for populate()

/**
 * Add a comment to a task
 */
export async function addComment(
    taskId: string,
    userId: string,
    text: string,
    taggedUserIds: string[] = []
): Promise<IComment> {
    await connectDB();

    const comment = await Comment.create({
        taskId,
        userId,
        text,
        taggedUserIds,
    });

    return JSON.parse(JSON.stringify(comment));
}

/**
 * Get all comments for a task with user info
 */
export async function getComments(taskId: string): Promise<any[]> {
    await connectDB();

    const comments = await Comment.find({ taskId })
        .sort({ createdAt: 1 })
        .populate("userId", "name email image")
        .lean();

    // Transform populated userId to a cleaner shape
    return JSON.parse(JSON.stringify(comments)).map((c: any) => ({
        ...c,
        user: c.userId
            ? {
                id: c.userId._id || c.userId.id,
                name: c.userId.name,
                image: c.userId.image,
            }
            : undefined,
    }));
}
