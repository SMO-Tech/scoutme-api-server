"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const player_profile_controller_1 = require("../controllers/player_profile_controller");
const router = (0, express_1.Router)();
router.get("/", player_profile_controller_1.listPlayerProfiles); // list all player profiles
router.get("/search", player_profile_controller_1.searchPlayerProfiles); // search player profiles by parameters
router.get("/:id", player_profile_controller_1.getPlayerProfileById); // get a player profile by id
router.put("/:id", player_profile_controller_1.updatePlayerProfile); // update a player profile
exports.default = router;
