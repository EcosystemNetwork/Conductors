
import { Node, Edge } from 'reactflow';
import { NodeData } from '@/lib/types';

export const defiScenario: { nodes: Node<NodeData>[]; edges: Edge[] } = {
    nodes: [
        {
            id: '1',
            type: 'agentNode',
            position: { x: 50, y: 150 },
            data: {
                label: 'Market Scanner',
                skills: ['scan', 'analyze'],
                costPerTask: 5
            },
        },
        {
            id: '2',
            type: 'taskNode',
            position: { x: 350, y: 150 },
            data: {
                label: 'Scan Yield Farms',
                description: 'Scan top 10 DeFi protocols for APY > 5%',
                requiredSkills: ['scan'],
                estimatedCost: 5
            },
        },
        {
            id: '3',
            type: 'agentNode',
            position: { x: 650, y: 50 },
            data: {
                label: 'Risk Analyst',
                skills: ['audit', 'verify'],
                costPerTask: 15
            },
        },
        {
            id: '4',
            type: 'taskNode',
            position: { x: 650, y: 250 },
            data: {
                label: 'Audit Contracts',
                description: 'Verify scanner results for rugpull risks',
                requiredSkills: ['audit'],
                estimatedCost: 15
            },
        },
        {
            id: '5',
            type: 'agentNode',
            position: { x: 950, y: 150 },
            data: {
                label: 'Execution Bot',
                skills: ['trade', 'execute'],
                costPerTask: 25
            },
        },
    ],
    edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '3', target: '4', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
    ]
};
