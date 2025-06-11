import prisma from '../../../prisma/prisma';
import { v4 as uuidv4 } from 'uuid';

const BATCH_SIZE = 500;

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const insertConnections = async (nodeIds: string[], connections: any[]) => {
    const result = [];
    for (const nodeId of nodeIds) {
        const data = connections.map(conn => ({
            id: uuidv4(),
            from: conn.from,
            to: conn.to,
            code: conn.code,
            fk_node_id: nodeId,
            updated_date: conn.updated_date,
            created_date: conn.created_date,
            deleted_at: conn.deleted_at
        }));
        const chunks = chunkArray(data, BATCH_SIZE);
        for (const chunk of chunks) {
            await prisma.connections.createMany({ data: chunk, skipDuplicates: true });
            result.push(...chunk);
            await delay(50);
        }
    }
    return result;
};

const insertNodeButtons = async (nodeIds: string[], buttons: any[]) => {
    const result = [];
    for (const nodeId of nodeIds) {
        const data = buttons.map(btn => ({
            id: uuidv4(),
            button_code: btn.button_code,
            name: btn.name,
            output_number: btn.output_number,
            fk_node_id: nodeId,
            updated_date: btn.updated_date,
            created_date: btn.created_date
        }));
        const chunks = chunkArray(data, BATCH_SIZE);
        for (const chunk of chunks) {
            await prisma.node_button.createMany({ data: chunk, skipDuplicates: true });
            result.push(...chunk);
            await delay(50);
        }
    }
    return result;
};

const insertNodesOutput = async (nodeIds: string[], outputs: any[]) => {
    const result = [];
    for (const nodeId of nodeIds) {
        const data = outputs.map(out => ({
            id: uuidv4(),
            nodes_code: out.nodes_code,
            side: out.side,
            class: out.class,
            fk_node_id: nodeId,
            output_code: out.output_code,
            updated_date: out.updated_date,
            created_date: out.created_date,
            deleted_at: out.deleted_at
        }));
        const chunks = chunkArray(data, BATCH_SIZE);
        for (const chunk of chunks) {
            await prisma.nodes_output.createMany({ data: chunk, skipDuplicates: true });
            result.push(...chunk);
            await delay(50);
        }
    }
    return result;
};

export {
    insertConnections, 
    insertNodeButtons, 
    insertNodesOutput
}

