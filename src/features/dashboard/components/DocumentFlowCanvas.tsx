"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    type Node as FlowNode,
    type Edge as FlowEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    ShoppingCart,
    FileText,
    Truck,
    CreditCard,
    Package,
    ArrowRight,
    Redo,
    User,
    Calendar
} from 'lucide-react';

// Shared footer showing who did the action and when
const NodeMeta = ({ user, createdAt }: { user?: string; createdAt?: string }) => {
    if (!user && !createdAt) return null;
    const dateStr = createdAt ? new Date(createdAt).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit'
    }) : null;
    return (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 flex-wrap">
            {user && (
                <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                    <User className="h-2.5 w-2.5" />
                    {user.split('@')[0]}
                </span>
            )}
            {dateStr && (
                <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                    <Calendar className="h-2.5 w-2.5" />
                    {dateStr}
                </span>
            )}
        </div>
    );
};


const BaseNode = ({ children, title, icon: Icon, colorClass, status, isCancelled }: any) => (
    <div className={cn(
        "p-4 rounded-2xl border shadow-lg bg-white min-w-[200px] border-l-4 transition-all duration-300 hover:shadow-xl",
        colorClass,
        isCancelled && "border-red-500 bg-red-50/30 opacity-80 scale-95"
    )}>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-400" />
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1.5 rounded-lg opacity-80",
                        isCancelled ? "bg-red-100 text-red-600" : colorClass.replace('border-l-4', 'bg-slate-100')
                    )}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        isCancelled ? "text-red-500" : "text-slate-500"
                    )}>{title} {isCancelled && '(ANULADO)'}</span>
                </div>
                {status && (
                    <Badge
                        variant={isCancelled ? "destructive" : "secondary"}
                        className="text-[10px] px-1 h-4"
                    >
                        {status}
                    </Badge>
                )}
            </div>
            <div className="py-1">
                {children}
            </div>
        </div>
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-400" />
    </div>
);

const CustomNodes = {
    sale: ({ data }: any) => {
        const isCancelled = data.status === 'CANCELLED';
        const isCreditNote = data.label?.startsWith('Nota de Crédito') || data.label?.includes('DV01');

        return (
            <BaseNode
                title={isCreditNote ? "Nota de Crédito" : "Venta"}
                icon={isCreditNote ? Redo : ShoppingCart}
                colorClass={isCreditNote ? "border-l-amber-400" : "border-l-indigo-500"}
                status={data.status}
                isCancelled={isCancelled}
            >
                <div className={cn("font-black", isCancelled ? "text-red-700 line-through" : (isCreditNote ? "text-amber-900" : "text-slate-800"))}>{data.label}</div>
                <div className={cn("text-lg font-black", isCancelled ? "text-red-500" : (isCreditNote ? "text-amber-600" : "text-indigo-600"))}>{formatCurrency(data.total)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{data.customer || 'Cliente General'}</div>
                <NodeMeta user={data.user} createdAt={data.createdAt} />
            </BaseNode>
        );
    },
    quotation: ({ data }: any) => (
        <BaseNode title="Cotización" icon={FileText} colorClass="border-l-orange-500" status={data.status}>
            <div className="font-bold text-slate-700">{data.label}</div>
            <div className="text-md font-black text-orange-600">{formatCurrency(data.total)}</div>
            <div className="text-[10px] text-slate-400 mt-1">{data.customer}</div>
            <NodeMeta user={data.user} createdAt={data.createdAt} />
        </BaseNode>
    ),
    purchase: ({ data }: any) => {
        const isCancelled = data.status === 'CANCELLED';
        return (
            <BaseNode title="Compra" icon={Truck} colorClass="border-l-emerald-500" status={data.status} isCancelled={isCancelled}>
                <div className={cn("font-bold", isCancelled ? "text-red-700 line-through" : "text-slate-700")}>{data.label}</div>
                <div className={cn("text-md font-black", isCancelled ? "text-red-500" : "text-emerald-600")}>{formatCurrency(data.total)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{data.supplier}</div>
                <NodeMeta user={data.user} createdAt={data.createdAt} />
            </BaseNode>
        );
    },
    stock: ({ data }: any) => {
        const isEntry = data.label.startsWith('+') || ['RETURN', 'REVERSAL', 'IN'].includes(data.type);
        const isReversal = data.isReversal;
        const isCancelled = data.isCancelled;

        return (
            <BaseNode
                title="Inventario"
                icon={Package}
                colorClass={isCancelled ? "border-l-red-500" : (isReversal ? "border-l-rose-500" : (isEntry ? "border-l-emerald-500" : "border-l-slate-800"))}
                isCancelled={isCancelled}
            >
                <div className={cn("font-bold", isCancelled ? "text-red-700 line-through" : "text-slate-700")}>{data.product}</div>
                <div className={cn(
                    "flex items-center gap-1 text-xs font-bold",
                    isCancelled ? "text-red-500" : (isReversal ? "text-rose-600" : (isEntry ? "text-emerald-600" : "text-slate-500"))
                )}>
                    {isReversal ? <Redo className="h-3 w-3 rotate-180" /> : (isEntry ? <Redo className="h-3 w-3 rotate-180" /> : <ArrowRight className="h-3 w-3" />)}
                    {data.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Almacén: {data.warehouse}</div>
                <NodeMeta user={data.user} createdAt={data.createdAt} />
            </BaseNode>
        );
    },
    payment: ({ data }: any) => {
        const isDebt = data.isDebt;
        const isExpense = data.isExpense;
        const isCancelled = data.isCancelled;

        return (
            <BaseNode
                title={isExpense ? "Egreso" : (isDebt ? "Deuda / Crédito" : (isCancelled ? "Pago (Anulado)" : "Pago"))}
                icon={CreditCard}
                colorClass={isCancelled ? "border-l-red-500" : (isExpense ? "border-l-rose-500" : (isDebt ? "border-l-orange-400" : "border-l-emerald-400"))}
                isCancelled={isCancelled}
            >
                <div className={cn("font-bold", isCancelled ? "text-red-700 line-through" : "text-slate-700")}>{data.label}</div>
                <div className={cn("text-md font-black", isCancelled ? "text-red-500" : (isExpense ? "text-rose-500" : (isDebt ? "text-orange-500" : "text-emerald-500")))}>
                    {formatCurrency(data.amount)}
                </div>
                <NodeMeta user={data.user} createdAt={data.createdAt} />
            </BaseNode>
        );
    },
    group: ({ data }: any) => (
        <div className="pl-3 pr-4 py-3 rounded-2xl border shadow-lg bg-white border-l-4 border-l-emerald-400 transition-all duration-300 hover:shadow-xl relative flex flex-row items-center gap-2">
            <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 bg-slate-400 absolute left-0" />
            <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 bg-slate-400 absolute right-0" />

            <div className="text-emerald-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                {data.label}
            </span>
        </div>
    ),
};

interface DocumentFlowCanvasProps {
    initialNodes: any[];
    initialEdges: any[];
}

export default function DocumentFlowCanvas({ initialNodes, initialEdges }: DocumentFlowCanvasProps) {
    const router = useRouter();
    // Apply layout once and set to state
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

    // Initialize/Layout nodes and edges when initial props change
    React.useEffect(() => {
        // 🎨 Edge Styling
        const styledEdges = initialEdges.map(edge => {
            const isReverse = edge.label?.toLowerCase().includes('devolución') || edge.label?.toLowerCase().includes('reingreso');
            return {
                ...edge,
                animated: true,
                style: {
                    stroke: isReverse ? '#f43f5e' : '#64748b',
                    strokeWidth: 2,
                    strokeDasharray: isReverse ? '5,5' : '0',
                },
                labelStyle: { fill: isReverse ? '#f43f5e' : '#64748b', fontWeight: 700, fontSize: 10 },
            };
        });

        // 🏗️ Hierarchical layout based on edges
        const finalNodes: any[] = [];
        const columnGap = 350;
        const rowGap = 160;

        // 1. Calculate indegree and adjacency list
        const inDegree: Record<string, number> = {};
        const adjList: Record<string, string[]> = {};

        initialNodes.forEach(n => {
            inDegree[n.id] = 0;
            adjList[n.id] = [];
        });

        initialEdges.forEach(e => {
            if (inDegree[e.target] !== undefined) {
                inDegree[e.target]++;
            }
            if (adjList[e.source]) {
                adjList[e.source].push(e.target);
            }
        });

        // 2. BFS to assign hierarchical levels
        const levels: Record<string, number> = {};
        const queue: { id: string, level: number }[] = [];

        // Find roots (nodes with no incoming edges)
        initialNodes.forEach(n => {
            if (inDegree[n.id] === 0) {
                queue.push({ id: n.id, level: 0 });
                levels[n.id] = 0;
            }
        });

        while (queue.length > 0) {
            const current = queue.shift()!;
            const neighbors = adjList[current.id] || [];

            for (const neighbor of neighbors) {
                // Determine maximum depth to avoid nodes overlapping backwards
                if (levels[neighbor] === undefined || levels[neighbor] < current.level + 1) {
                    levels[neighbor] = current.level + 1;
                    queue.push({ id: neighbor, level: current.level + 1 });
                }
            }
        }

        // Handle potential disconnected nodes
        initialNodes.forEach(n => {
            if (levels[n.id] === undefined) {
                levels[n.id] = 0;
            }
        });

        // 3. Group by level and assign coordinates
        const nodesByLevel: Record<number, any[]> = {};
        initialNodes.forEach(n => {
            const lvl = levels[n.id];
            if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
            nodesByLevel[lvl].push(n);
        });

        // 4. Position nodes
        Object.keys(nodesByLevel).forEach(levelStr => {
            const level = parseInt(levelStr);
            const colNodes = nodesByLevel[level];

            // Center nodes vertically relative to the root
            const startY = -((colNodes.length - 1) * rowGap) / 2;

            colNodes.forEach((node, index) => {
                finalNodes.push({
                    ...node,
                    position: {
                        x: level * columnGap,
                        y: startY + (index * rowGap)
                    },
                });
            });
        });

        setNodes(finalNodes);
        setEdges(styledEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const handleNodeClick = React.useCallback(
        (_: React.MouseEvent, node: FlowNode) => {
            const [type] = node.id.split(':');

            // Try to extract document number like NV01-000011 to use in search
            const match = typeof node.data.label === 'string' ? node.data.label.match(/[A-Z0-9]+-\d+/) : null;
            const searchParam = match ? `?search=${match[0]}` : '';

            switch (type) {
                case 'SALE':
                    router.push(`/sales${searchParam}`);
                    break;
                case 'PURCHASE':
                    router.push(`/purchases${searchParam}`);
                    break;
                case 'QUOTATION':
                    router.push(`/sales/quotations${searchParam}`);
                    break;
                case 'STOCK_MOVEMENT':
                    router.push(`/inventory/movements${searchParam}`);
                    break;
                case 'CASH_TRANSACTION':
                    router.push(`/cash`);
                    break;
                case 'CREDIT_MOVEMENT':
                    if (node.data.isExpense) {
                        router.push(`/finance/payables${searchParam}`);
                    } else {
                        router.push(`/finance/receivables${searchParam}`);
                    }
                    break;
            }
        },
        [router]
    );

    return (
        <div className="w-full h-[600px] border rounded-3xl overflow-hidden bg-slate-50/30 group">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={CustomNodes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
            >
                <Background color="#cbd5e1" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
}

