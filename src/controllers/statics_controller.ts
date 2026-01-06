import { RequestHandler } from "express";
import { smoV1Pool } from "../utils/db";


// Note: This function requires a 'statics' model in Prisma schema
// export const getStatics: RequestHandler = async (req, res) => {
//     try {
//         const statics = await prisma.statics.findMany();
//         res.status(200).json({ statics });
//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

export const getPlayerStatistics: RequestHandler = async (req, res) => {
    try {
        // Get player_id from query parameters or route parameters
        const playerId = req.query.player_id || req.params.player_id;
        
        if (!playerId) {
            return res.status(400).json({ 
                status: "error", 
                message: "player_id is required" 
            });
        }

        // Validate player_id is a number
        const playerIdNum = parseInt(playerId as string, 10);
        if (isNaN(playerIdNum)) {
            return res.status(400).json({ 
                status: "error", 
                message: "player_id must be a valid number" 
            });
        }

        // Check if SMO_V1 database connection is configured
        if (!smoV1Pool) {
            return res.status(500).json({ 
                status: "error", 
                message: "SMO_V1 database connection not configured. Please set SMO_V1_DATABASE_URL environment variable." 
            });
        }

        // Get schema from environment variable or default to 'public'
        const schema = process.env.SMO_V1_SCHEMA || 'public';
        const tableName = process.env.SMO_V1_STATISTICS_TABLE || 'statistics_cache';
        
        // Build the base query
        const buildQuery = (schemaName: string, tblName: string) => `
            SELECT
                cache_type,
                player_id,
                action_type,
                statistics_data->'attacking' AS attacking_spider,
                statistics_data->'defensive' AS defensive_spider,
                donut_chart_data->'attacking' AS attacking_donut,
                donut_chart_data->'defensive' AS defensive_donut,
                heatmap_data->'attacking' AS attacking_heatmap,
                heatmap_data->'defensive' AS defensive_heatmap,
                goalpost_statistics_data,
                average_statistics AS summary_table
            FROM ${schemaName}.${tblName}
            WHERE cache_type = 'player'
              AND player_id = $1
        `;

        let result: any = null;
        let queryError: any = null;
        
        // Try to find the table in different schemas if it doesn't exist in the specified schema
        try {
            const query = buildQuery(schema, tableName);
            result = await smoV1Pool.query(query, [playerIdNum]);
        } catch (tableError: any) {
            queryError = tableError;
            // If table doesn't exist, try to find it in other common schemas
            if (tableError.message && tableError.message.includes('does not exist')) {
                console.error(`Table ${schema}.${tableName} not found. Attempting to find table...`);
                
                // Try common schema names
                const schemasToTry = ['public', 'smo_v1', 'smo', 'statistics'];
                
                for (const trySchema of schemasToTry) {
                    if (trySchema === schema) continue; // Skip the one we already tried
                    
                    try {
                        const tryQuery = buildQuery(trySchema, tableName);
                        result = await smoV1Pool.query(tryQuery, [playerIdNum]);
                        console.log(`Found table in schema: ${trySchema}`);
                        queryError = null;
                        break;
                    } catch (err: any) {
                        // Continue to next schema
                        continue;
                    }
                }
                
                // If still not found, try without schema qualification (default schema search path)
                if (!result) {
                    try {
                        const noSchemaQuery = `
                            SELECT
                                cache_type,
                                player_id,
                                action_type,
                                statistics_data->'attacking' AS attacking_spider,
                                statistics_data->'defensive' AS defensive_spider,
                                donut_chart_data->'attacking' AS attacking_donut,
                                donut_chart_data->'defensive' AS defensive_donut,
                                heatmap_data->'attacking' AS attacking_heatmap,
                                heatmap_data->'defensive' AS defensive_heatmap,
                                goalpost_statistics_data,
                                average_statistics AS summary_table
                            FROM ${tableName}
                            WHERE cache_type = 'player'
                              AND player_id = $1
                        `;
                        result = await smoV1Pool.query(noSchemaQuery, [playerIdNum]);
                        console.log(`Found table without schema qualification`);
                        queryError = null;
                    } catch (err: any) {
                        // Last attempt: try to list available tables
                        const listTablesQuery = `
                            SELECT table_schema, table_name 
                            FROM information_schema.tables 
                            WHERE table_name LIKE '%statistic%' OR table_name LIKE '%cache%'
                            ORDER BY table_schema, table_name
                        `;
                        const tablesResult = await smoV1Pool.query(listTablesQuery);
                        
                        return res.status(500).json({ 
                            status: "error", 
                            message: `Table '${tableName}' not found in schema '${schema}' or common schemas.`,
                            error: tableError.message,
                            availableTables: tablesResult.rows.length > 0 ? tablesResult.rows : "No matching tables found. Please check your database connection and table name."
                        });
                    }
                }
            } else {
                throw tableError;
            }
        }
        
        // If we still don't have a result, throw the original error
        if (!result && queryError) {
            throw queryError;
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                status: "error", 
                message: "No statistics found for the given player_id" 
            });
        }

        res.status(200).json({
            status: "success",
            message: "Player statistics fetched successfully",
            data: result.rows
        });
    } catch (error: any) {
        console.error("Error fetching player statistics:", error);
        res.status(500).json({ 
            status: "error", 
            message: "Internal server error",
            error: error.message || "Something went wrong"
        });
    }
}