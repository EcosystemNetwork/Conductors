
export interface AgentNodeData {
    label: string;
    skills: string[];
    costPerTask: number;
}

export interface TaskNodeData {
    label: string;
    description: string;
    requiredSkills: string[];
    estimatedCost: number;
}

export type NodeData = AgentNodeData | TaskNodeData;
