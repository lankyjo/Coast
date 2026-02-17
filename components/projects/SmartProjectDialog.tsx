"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ArrowRight, Wand2, Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { generateProjectPlan } from "@/actions/ai.actions";
import { createProject } from "@/actions/project.actions"; // Assuming this exists or will be used
import { createTask } from "@/actions/task.actions"; // Assuming this exists
import { SmartProjectPlan, SmartProjectTask } from "@/types/ai.types";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export function SmartProjectDialog() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"input" | "review" | "creating">("input");
    const [goal, setGoal] = useState("");
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<SmartProjectPlan | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const router = useRouter();
    const { user } = useAuthStore();

    const handleGenerate = async () => {
        if (!goal.trim()) return;
        setLoading(true);
        try {
            const result = await generateProjectPlan(goal);
            if (result.success && result.data) {
                setPlan(result.data);
                // Select all tasks by default
                const allTaskIds = new Set<string>();
                result.data.phases.forEach((phase, pIdx) => {
                    phase.tasks.forEach((_, tIdx) => {
                        allTaskIds.add(`${pIdx}-${tIdx}`);
                    });
                });
                setSelectedTasks(allTaskIds);
                setStep("review");
            } else {
                toast.error(result.error || "Failed to generate plan");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!plan || !user) return;
        setStep("creating");

        try {
            // 1. Create the project
            // calculating total duration roughly from tasks to set a deadline
            // defaulting to 30 days from now if not specified
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 30);

            const projectResult = await createProject({
                name: plan.projectTitle,
                description: plan.description,
                status: "active",
                deadline: deadline.toISOString(),
                startDate: new Date().toISOString(),
                tags: ["AI Generated"],
            });

            if (!projectResult.success || !projectResult.data) {
                throw new Error("Failed to create project");
            }

            const projectId = projectResult.data._id;
            const projectSlug = projectId; // Assuming slug is ID or we redirect to ID

            // 2. Create phases/tasks
            let tasksCreated = 0;

            for (let pIdx = 0; pIdx < plan.phases.length; pIdx++) {
                const phase = plan.phases[pIdx];

                for (let tIdx = 0; tIdx < phase.tasks.length; tIdx++) {
                    const taskKey = `${pIdx}-${tIdx}`;
                    if (!selectedTasks.has(taskKey)) continue;

                    const task = phase.tasks[tIdx];

                    // Create task
                    await createTask({
                        title: `${phase.name}: ${task.title}`,
                        description: task.description,
                        projectId: projectId,
                        status: "todo",
                        priority: task.priority,
                        deadline: deadline.toISOString(), // simplified for now
                        assigneeIds: [], // We need a way to map names to IDs, skipping for now
                        assignedBy: user.id,
                        visibility: "general",
                        estimatedHours: task.estimatedHours,
                        subtasks: task.subtasks?.map(st => ({ title: st.title, done: false })) || [],
                    });
                    tasksCreated++;
                }
            }

            toast.success(`Project created with ${tasksCreated} tasks!`);
            setOpen(false);
            setStep("input");
            setGoal("");
            setPlan(null);
            router.push(`/projects/${projectSlug}`);

        } catch (error) {
            console.error(error);
            toast.error("Failed to create project infrastructure");
            setStep("review");
        }
    };

    const toggleTask = (pIdx: number, tIdx: number) => {
        const key = `${pIdx}-${tIdx}`;
        const newSet = new Set(selectedTasks);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedTasks(newSet);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Smart Plan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-indigo-600" />
                        AI Project Planner
                    </DialogTitle>
                    <DialogDescription>
                        Describe your goal, and I'll build a complete project plan with phases and tasks.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-1">
                    {step === "input" && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="goal">What do you want to achieve?</Label>
                                <Textarea
                                    id="goal"
                                    placeholder="e.g. Launch a new marketing website for a client by next month, limiting budget to 40 hours."
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    className="min-h-[150px] resize-none text-base"
                                />
                            </div>
                            <div className="bg-indigo-50 text-indigo-800 text-sm p-3 rounded-md flex items-start gap-2">
                                <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>
                                    Tip: Be specific about deadlines, phases, or special requirements. The AI will read your team's expertise to assign the right people.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === "review" && plan && (
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">{plan.projectTitle}</h3>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>

                                <div className="space-y-6">
                                    {plan.phases.map((phase, pIdx) => (
                                        <div key={pIdx} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-slate-100 font-bold">
                                                    Phase {pIdx + 1}
                                                </Badge>
                                                <h4 className="font-semibold text-slate-800">{phase.name}</h4>
                                            </div>

                                            <div className="space-y-2 pl-2">
                                                {phase.tasks.map((task, tIdx) => {
                                                    const isSelected = selectedTasks.has(`${pIdx}-${tIdx}`);
                                                    return (
                                                        <Card
                                                            key={tIdx}
                                                            className={`p-3 border transition-colors ${isSelected ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 opacity-60'}`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleTask(pIdx, tIdx)}
                                                                />
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-medium text-sm">{task.title}</span>
                                                                        <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                                                                            {task.priority}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

                                                                    {/* Subtasks Preview */}
                                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                                        <div className="pl-2 border-l-2 border-indigo-100 mt-2 space-y-1">
                                                                            {task.subtasks.map((st, sIdx) => (
                                                                                <div key={sIdx} className="text-xs text-slate-500 flex items-start gap-1">
                                                                                    <span className="mt-0.5">•</span>
                                                                                    <span>{st.title}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                                                                        <div className="flex items-center gap-1">
                                                                            <User className="h-3 w-3" />
                                                                            {task.suggestedAssigneeName || "Unassigned"}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            {task.estimatedHours}h
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    {step === "creating" && (
                        <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Building Project...</h3>
                                <p className="text-sm text-muted-foreground">Creating project, phases, and tasks.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === "input" && (
                        <Button onClick={handleGenerate} disabled={!goal.trim() || loading} className="w-full sm:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Goal...
                                </>
                            ) : (
                                <>
                                    Generate Plan
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    )}

                    {step === "review" && (
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="ghost" onClick={() => setStep("input")}>Back</Button>
                            <Button onClick={handleCreateProject} disabled={selectedTasks.size === 0}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Create Project ({selectedTasks.size} Tasks)
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
