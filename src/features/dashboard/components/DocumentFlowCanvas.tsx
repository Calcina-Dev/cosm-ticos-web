"use client";

import React, { useMemo } from 'react';
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

        // 🏗️ Grouping for simple horizontal layout
        const typeOrder = ['quotation', 'purchase', 'sale', 'group', 'payment', 'stock'];
        const columns: Record<string, any[]> = {};
        typeOrder.forEach(t => columns[t] = []);

        initialNodes.forEach(node => {
            if (columns[node.type]) columns[node.type].push(node);
            else {
                if (!columns['other']) columns['other'] = [];
                columns['other'].push(node);
            }
        });

        const finalNodes: any[] = [];
        let currentX = 0;
        const columnGap = 380;
        const rowGap = 160;

        Object.keys(columns).forEach(type => {
            const colNodes = columns[type];
            if (colNodes.length === 0) return;

            colNodes.forEach((node, index) => {
                finalNodes.push({
                    ...node,
                    position: { x: currentX, y: index * rowGap },
                });
            });
            currentX += columnGap;
        });

        setNodes(finalNodes);
        setEdges(styledEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <div className="w-full h-[600px] border rounded-3xl overflow-hidden bg-slate-50/30 group">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
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

