"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClub = exports.updateClub = exports.createClub = exports.getClubById = exports.listClubs = void 0;
const db_1 = require("../utils/db");
// List all clubs
const listClubs = async (req, res) => {
    try {
        const clubs = await db_1.prisma.club.findMany();
        res.status(200).json({ status: "success", message: "Clubs listed successfully", data: clubs });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};
exports.listClubs = listClubs;
// Get a club by id
const getClubById = async (req, res) => {
    try {
        const { id } = req.params;
        const club = await db_1.prisma.club.findUnique({ where: { id } });
        res.status(200).json({ status: "success", message: "Club fetched successfully", data: club });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};
exports.getClubById = getClubById;
// create a new club
const createClub = async (req, res) => {
    try {
        const { name, country, logoUrl } = req.body;
        const club = await db_1.prisma.club.create({
            data: { name, country, logoUrl },
        });
        res.status(200).json({ status: "success", message: "Club created successfully", data: club });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};
exports.createClub = createClub;
// update a club
const updateClub = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, country, logoUrl } = req.body;
        const club = await db_1.prisma.club.update({ where: { id }, data: { name, country, logoUrl } });
        res.status(200).json({ status: "success", message: "Club updated successfully", data: club });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};
exports.updateClub = updateClub;
// delete a club
const deleteClub = async (req, res) => {
    try {
        const { id } = req.params;
        const club = await db_1.prisma.club.delete({ where: { id } });
        if (!club) {
            return res.status(404).json({ status: "error", message: "Club not found" });
        }
        res.status(200).json({ status: "success", message: "Club deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Something went wrong", error: error.message || "Something went wrong" });
    }
};
exports.deleteClub = deleteClub;
