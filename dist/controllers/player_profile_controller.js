"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlayerProfile = exports.searchPlayerProfiles = exports.getPlayerProfileById = exports.listPlayerProfiles = void 0;
const db_1 = require("../utils/db");
const helper_functions_1 = require("../utils/helper_functions");
// List all player profiles
const listPlayerProfiles = async (req, res) => {
    try {
        const playerProfiles = await db_1.prisma.playerProfile.findMany();
        const formattedProfiles = playerProfiles.map((profile) => ({
            ...profile,
            dateOfBirth: profile.dateOfBirth ? (0, helper_functions_1.formatDate)(new Date(profile.dateOfBirth)) : null
        }));
        res.status(200).json({ status: "success", message: "Player profiles listed successfully", data: formattedProfiles });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};
exports.listPlayerProfiles = listPlayerProfiles;
// Get a player profile by id
const getPlayerProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const playerProfile = await db_1.prisma.playerProfile.findUnique({ where: {
                id
            } });
        if (!playerProfile) {
            return res.status(404).json({ status: "error", message: "Player profile not found" });
        }
        const formattedProfile = {
            ...playerProfile,
            dateOfBirth: playerProfile.dateOfBirth ? (0, helper_functions_1.formatDate)(new Date(playerProfile.dateOfBirth)) : null
        };
        res.status(200).json({ status: "success", message: "Player profile fetched successfully", data: formattedProfile });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};
exports.getPlayerProfileById = getPlayerProfileById;
// search player profiles by parameters
const searchPlayerProfiles = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, country } = req.query;
        console.log(req.query);
        console.log(firstName, lastName, dateOfBirth, country);
        // Build where clause conditionally
        const where = {};
        if (firstName && typeof firstName === 'string') {
            where.firstName = { contains: firstName, mode: 'insensitive' };
        }
        if (lastName && typeof lastName === 'string') {
            where.lastName = { contains: lastName, mode: 'insensitive' };
        }
        if (dateOfBirth && typeof dateOfBirth === 'string') {
            // Parse date string (expecting DD-MM-YYYY or YYYY-MM-DD format)
            const date = new Date(dateOfBirth);
            if (!isNaN(date.getTime())) {
                where.dateOfBirth = { equals: date };
            }
        }
        if (country && typeof country === 'string') {
            where.country = { contains: country, mode: 'insensitive' };
        }
        const playerProfiles = await db_1.prisma.playerProfile.findMany({ where });
        const formattedProfiles = playerProfiles.map((profile) => ({
            ...profile,
            dateOfBirth: profile.dateOfBirth ? (0, helper_functions_1.formatDate)(new Date(profile.dateOfBirth)) : null
        }));
        res.status(200).json({ status: "success", message: "Player profiles searched successfully", data: formattedProfiles });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};
exports.searchPlayerProfiles = searchPlayerProfiles;
// update a player profile
const updatePlayerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, dateOfBirth, country, avatar, primaryPosition } = req.body;
        // Check if player profile exists
        const existingProfile = await db_1.prisma.playerProfile.findUnique({ where: { id } });
        if (!existingProfile) {
            return res.status(404).json({ status: "error", message: "Player profile not found" });
        }
        // Prepare update data
        const updateData = {};
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (country !== undefined)
            updateData.country = country;
        if (avatar !== undefined)
            updateData.avatar = avatar;
        if (primaryPosition !== undefined)
            updateData.primaryPosition = primaryPosition;
        // Parse dateOfBirth from DD-MM-YYYY format
        if (dateOfBirth !== undefined) {
            const parsedDate = (0, helper_functions_1.parseDate)(dateOfBirth);
            if (parsedDate) {
                updateData.dateOfBirth = parsedDate;
            }
            else if (dateOfBirth !== null) {
                return res.status(400).json({ status: "error", message: "Invalid date format. Expected DD-MM-YYYY" });
            }
            else {
                updateData.dateOfBirth = null;
            }
        }
        const playerProfile = await db_1.prisma.playerProfile.update({
            where: { id },
            data: updateData
        });
        // Format the response
        const formattedProfile = {
            ...playerProfile,
            dateOfBirth: playerProfile.dateOfBirth ? (0, helper_functions_1.formatDate)(new Date(playerProfile.dateOfBirth)) : null
        };
        res.status(200).json({ status: "success", message: "Player profile updated successfully", data: formattedProfile });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};
exports.updatePlayerProfile = updatePlayerProfile;
