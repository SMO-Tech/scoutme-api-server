"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const club_controller_1 = require("../controllers/club_controller");
const router = (0, express_1.Router)();
router.get("/", club_controller_1.listClubs); // list all clubs
router.get("/:id", club_controller_1.getClubById); // get a club by id
router.post("/", club_controller_1.createClub); // create a new club
router.put("/:id", club_controller_1.updateClub); // update a club
router.delete("/:id", club_controller_1.deleteClub); // delete a club
exports.default = router;
