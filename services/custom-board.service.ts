"use server";

import { connectDB } from "@/lib/db";
import { CustomBoard, ICustomBoard } from "@/models/custom-board.model";
import mongoose from "mongoose";

export async function createCustomBoard(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    createdBy: string;
}): Promise<ICustomBoard> {
    await connectDB();
    const board = await CustomBoard.create(data);
    return JSON.parse(JSON.stringify(board));
}

export async function getCustomBoards(userId: string): Promise<ICustomBoard[]> {
    await connectDB();
    const boards = await CustomBoard.find({ createdBy: userId })
        .sort({ isPinned: -1, name: 1 })
        .lean();
    return JSON.parse(JSON.stringify(boards));
}

export async function getCustomBoardById(id: string): Promise<ICustomBoard | null> {
    await connectDB();
    const board = await CustomBoard.findById(id)
        .populate("taskIds")
        .lean();
    if (!board) return null;
    return JSON.parse(JSON.stringify(board));
}

export async function updateCustomBoard(
    id: string,
    data: Partial<ICustomBoard>
): Promise<ICustomBoard | null> {
    await connectDB();
    const board = await CustomBoard.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
    ).lean();
    if (!board) return null;
    return JSON.parse(JSON.stringify(board));
}

export async function deleteCustomBoard(id: string): Promise<boolean> {
    await connectDB();
    const result = await CustomBoard.findByIdAndDelete(id);
    return !!result;
}

export async function addTaskToCustomBoard(boardId: string, taskId: string): Promise<ICustomBoard | null> {
    await connectDB();
    const board = await CustomBoard.findByIdAndUpdate(
        boardId,
        { $addToSet: { taskIds: new mongoose.Types.ObjectId(taskId) } },
        { returnDocument: "after" }
    ).lean();
    if (!board) return null;
    return JSON.parse(JSON.stringify(board));
}

export async function removeTaskFromCustomBoard(boardId: string, taskId: string): Promise<ICustomBoard | null> {
    await connectDB();
    const board = await CustomBoard.findByIdAndUpdate(
        boardId,
        { $pull: { taskIds: new mongoose.Types.ObjectId(taskId) } },
        { returnDocument: "after" }
    ).lean();
    if (!board) return null;
    return JSON.parse(JSON.stringify(board));
}
