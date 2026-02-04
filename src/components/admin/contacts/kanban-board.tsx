"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Phone, Mail, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---

export type LeadStage =
    | "new"
    | "contacted"
    | "meeting"
    | "signed_contract"
    | "course_scheduled"
    | "course_done"
    | "active"
    | "rejected";

export interface Lead {
    id: string;
    name: string;
    companyName?: string;
    role: string;
    email?: string;
    phone?: string;
    stage: LeadStage;
    value?: number;
    nextStep?: string;
    notes?: string;
    avatarSeed?: string;
    logo?: string;
    mediator?: string;
}

interface KanbanBoardProps {
    leads: Lead[];
    onLeadsChange: (leads: Lead[]) => void;
    onAddLead?: (stage: LeadStage) => void;
}

// --- Constants ---

const STAGES: { id: LeadStage; label: string; color: string }[] = [
    { id: "contacted", label: "Contacted", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300" },
    { id: "meeting", label: "Meeting", color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300" },
    { id: "signed_contract", label: "Signed Contract", color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300" },
    { id: "course_scheduled", label: "Course Scheduled", color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300" },
    { id: "course_done", label: "Course Done", color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300" },
    { id: "active", label: "Active", color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300" },
];

export function KanbanBoard({ leads, onLeadsChange }: KanbanBoardProps) {

    const handleStageChange = (leadId: string, newStage: LeadStage) => {
        // If moving to Active, confirm? No, just do it for now.
        const updatedLeads = leads.map(l =>
            l.id === leadId ? { ...l, stage: newStage } : l
        );
        onLeadsChange(updatedLeads);
    };

    // Helper to check if a stage is "passed" or "active"
    const isStageActiveOrPassed = (currentStage: LeadStage, checkStage: LeadStage) => {
        const stageOrder: LeadStage[] = ["new", "contacted", "meeting", "signed_contract", "course_scheduled", "course_done", "active", "rejected"];
        const currentIndex = stageOrder.indexOf(currentStage);
        const checkIndex = stageOrder.indexOf(checkStage);
        return checkIndex <= currentIndex;
    };

    return (
        <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/80 dark:bg-gray-900/50">
                    <TableRow>
                        <TableHead className="w-[250px]">Lead</TableHead>
                        <TableHead className="w-[180px]">Contact Info</TableHead>
                        <TableHead className="w-[150px]">Mediator</TableHead>
                        {STAGES.map((stage) => (
                            <TableHead key={stage.id} className="text-center w-[100px] min-w-[80px]">
                                {stage.label}
                            </TableHead>
                        ))}
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id} className="group hover:bg-muted/50">
                            {/* Lead Info */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                        <AvatarImage src={lead.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.avatarSeed || lead.companyName || lead.id}`} />
                                        <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight">
                                            {lead.companyName || lead.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{lead.name}</span>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Contact Info */}
                            <TableCell>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    {lead.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" /> {lead.phone}
                                        </div>
                                    )}
                                    {lead.email && (
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="h-3 w-3" /> <span className="truncate max-w-[150px]">{lead.email}</span>
                                        </div>
                                    )}
                                </div>
                            </TableCell>

                            {/* Mediator */}
                            <TableCell>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {lead.mediator || "-"}
                                </span>
                            </TableCell>

                            {/* Checkbox Stages */}
                            {STAGES.map((stage) => {
                                const isActive = lead.stage === stage.id;
                                const isPassed = isStageActiveOrPassed(lead.stage, stage.id);

                                return (
                                    <TableCell key={stage.id} className="p-2 text-center">
                                        <div
                                            className={`
                        mx-auto h-6 w-6 rounded border flex items-center justify-center cursor-pointer transition-all duration-200
                        ${isPassed
                                                    ? `${stage.color.split(' ')[1]} ${stage.color.split(' ')[0]} border-transparent shadow-sm`
                                                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 bg-white dark:bg-gray-950"
                                                }
                        ${isActive ? "ring-2 ring-offset-1 ring-primary/20 scale-110" : ""}
                      `}
                                            onClick={() => handleStageChange(lead.id, stage.id)}
                                            title={`Mark as ${stage.label}`}
                                        >
                                            {isPassed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                        </div>
                                    </TableCell>
                                );
                            })}

                            {/* Actions */}
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lead.email || "")}>
                                            Copy Email
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">Archive / Reject</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {leads.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4 + STAGES.length} className="text-center py-8 text-muted-foreground">
                                No active leads in the pipeline.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
