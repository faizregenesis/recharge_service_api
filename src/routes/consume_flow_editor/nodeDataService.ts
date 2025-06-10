import prisma from '../../../prisma/prisma';
import { v4 as uuidv4 } from 'uuid';

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
        await prisma.connections.createMany({ data, skipDuplicates: true });
        result.push(...data);
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
        await prisma.node_button.createMany({ data, skipDuplicates: true });
        result.push(...data);
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
        await prisma.nodes_output.createMany({ data, skipDuplicates: true });
        result.push(...data);
    }
    return result;
};

export {
    insertConnections, 
    insertNodeButtons, 
    insertNodesOutput
}

