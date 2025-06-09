import prisma from '../../../prisma/prisma';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const generateRandomString = (length = 6) => {
    return randomBytes(length).toString('hex').slice(0, length);
};

const insertNodes = async (node: any, podIds: string[]) => {
    const inserted = [];
    for (const podId of podIds) {
        const result = await prisma.node.create({
            data: {
                code: generateRandomString(),
                label: node.label,
                type: node.type,
                position_x: node.position_x,
                position_y: node.position_y,
                inputs: node.inputs,
                pod_id: podId,
                pob_state: node.pob_state,
                template_style: node.template_style,
                updated_date: node.updated_date,
                created_date: node.created_date,
                deleted_at: node.deleted_at
            }
        });
        inserted.push(result);
    }
    return inserted;
};

const insertConnections = async (nodeIds: string[], connections: any[]) => {
    const result = [];
    for (const nodeId of nodeIds) {
        const data = connections.map(conn => ({
            id: uuidv4(),
            from: conn.from,
            to: conn.to,
            code: `${conn.code}_${nodeId}`,
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
            button_code: `${btn.button_code}_${nodeId}`,
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
            nodes_code: `${out.nodes_code}_${nodeId}`,
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
    insertNodes, 
    insertConnections, 
    insertNodeButtons, 
    insertNodesOutput
}

