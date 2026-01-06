import {Request, RequestHandler, Response} from "express";
import {prisma} from "../utils/db";
import { formatDate, parseDate } from "../utils/helper_functions";
import { PlayerProfile } from "@prisma/client";

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date | null): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Validate the date - return null for invalid dates
    if (isNaN(birthDate.getTime())) return null;
    
    // Return null for dates that are clearly invalid (before 1900 or in the future)
    const birthYear = birthDate.getFullYear();
    const currentYear = today.getFullYear();
    if (birthYear < 1900 || birthYear > currentYear) {
        return null;
    }
    
    let age = currentYear - birthYear;
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    // Return null for negative ages (future dates) or unreasonably high ages
    if (age < 0 || age > 150) {
        return null;
    }
    
    return age; 
}

// List all player profiles with cursor-based pagination
export const listPlayerProfiles = async (req : Request, res : Response) => {
    try {
        // Parse query parameters
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 4; // Default 4 (for 4 items per row), max 100
        const take = Math.min(limit, 100); // Cap at 100 records per page

        // Build query with cursor pagination
        const queryOptions: any = {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryPosition: true,
                city: true,
                state: true,
                country: true,
                dateOfBirth: true,
                thumbIconUrl: true,
                thumbNormalUrl: true,
                thumbProfileUrl: true,
                thumbUrl: true,
            },
            take: take + 1, // Fetch one extra to check if there's a next page
            orderBy: {
                id: 'asc', // Order by id for consistent cursor pagination
            }
        };

        // Add cursor if provided
        if (cursor) {
            queryOptions.cursor = {
                id: cursor
            };
            queryOptions.skip = 1; // Skip the cursor record itself
        }

        const playerProfiles = await prisma.playerProfile.findMany(queryOptions);

        // Check if there's a next page
        const hasNextPage = playerProfiles.length > take;
        const profiles = hasNextPage ? playerProfiles.slice(0, take) : playerProfiles;
        const nextCursor = hasNextPage ? profiles[profiles.length - 1].id : null;

        const formattedProfiles = profiles.map((profile) => {
            // Build location string from city, state, country
            const locationParts = [profile.city, profile.state, profile.country].filter(Boolean);
            const location = locationParts.length > 0 ? locationParts.join(', ') : null;

            // Get primary image URL - prioritize thumbNormalUrl, then fallback to others
            const imageUrl = profile.thumbNormalUrl || 
                           profile.thumbProfileUrl || 
                           profile.thumbUrl || 
                           profile.thumbIconUrl || 
                           null;

            return {
                id: profile.id,
                name: `${profile.firstName} ${profile.lastName}`.trim(),
                position: profile.primaryPosition,
                location,
                age: calculateAge(profile.dateOfBirth),
                imageUrl, // Primary image for easy access
                profile: {
                    thumbUrl: profile.thumbUrl,
                    thumbProfileUrl: profile.thumbProfileUrl,
                    thumbNormalUrl: profile.thumbNormalUrl,
                    thumbIconUrl: profile.thumbIconUrl,
                },
            };
        });

        res.status(200).json({
            status: "success",
            message: "Player profiles listed successfully",
            data: formattedProfiles,
            pagination: {
                hasNextPage,
                nextCursor,
                limit: take,
            }
        });
    } catch (error : any) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};

// Get a player profile by id
export const getPlayerProfileById = async (req : Request, res : Response) => {
    try {
        const {id} = req.params;
        const playerProfile = await prisma.playerProfile.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        photoUrl: true,
                    }
                },
                matchPlayers: {
                    select: {
                        id: true,
                        jerseyNumber: true,
                        position: true,
                        isHomeTeam: true,
                        match: {
                            select: {
                                id: true,
                                matchDate: true,
                                competitionName: true,
                                venue: true,
                                status: true,
                            }
                        }
                    },
                    orderBy: {
                        match: {
                            matchDate: 'desc'
                        }
                    },
                    take: 10 // Limit to last 10 matches
                }
            }
        });

        if (!playerProfile) {
            return res.status(404).json({status: "error", message: "Player profile not found"});
        }

        // Fetch club memberships separately with proper ordering
        const clubMemberships = await prisma.clubMembership.findMany({
            where: {
                playerProfileId: id
            },
            include: {
                club: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                        logoUrl: true,
                        thumbUrl: true,
                        thumbProfileUrl: true,
                        thumbNormalUrl: true,
                        thumbIconUrl: true,
                    }
                }
            },
            orderBy: [
                { isCurrent: 'desc' },
                { startDate: 'desc' }
            ]
        });

        // Build location string from city, state, country
        const locationParts = [playerProfile.city, playerProfile.state, playerProfile.country].filter(Boolean);
        const location = locationParts.length > 0 ? locationParts.join(', ') : null;

        // Build images array from non-null image URLs
        const images = [
            playerProfile.thumbUrl,
            playerProfile.thumbProfileUrl,
            playerProfile.thumbNormalUrl,
            playerProfile.thumbIconUrl,
        ].filter((url): url is string => url !== null);

        // Format club memberships
        const formattedMemberships = clubMemberships.map(membership => ({
            id: membership.id,
            club: membership.club,
            startDate: membership.startDate ? formatDate(new Date(membership.startDate)) : null,
            endDate: membership.endDate ? formatDate(new Date(membership.endDate)) : null,
            isCurrent: membership.isCurrent,
            createdAt: formatDate(new Date(membership.createdAt)),
        }));

        // Format match history
        const formattedMatches = playerProfile.matchPlayers.map(mp => ({
            id: mp.id,
            jerseyNumber: mp.jerseyNumber,
            position: mp.position,
            isHomeTeam: mp.isHomeTeam,
            match: {
                id: mp.match.id,
                matchDate: mp.match.matchDate ? formatDate(new Date(mp.match.matchDate)) : null,
                competitionName: mp.match.competitionName,
                venue: mp.match.venue,
                status: mp.match.status,
            }
        }));

        // Format the complete profile
        const formattedProfile = {
            // Basic Info
            id: playerProfile.id,
            name: `${playerProfile.firstName} ${playerProfile.lastName}`.trim(),
            firstName: playerProfile.firstName,
            lastName: playerProfile.lastName,
            dateOfBirth: playerProfile.dateOfBirth ? formatDate(new Date(playerProfile.dateOfBirth)) : null,
            age: calculateAge(playerProfile.dateOfBirth),
            
            // Location
            location,
            city: playerProfile.city,
            state: playerProfile.state,
            country: playerProfile.country,
            nationality: playerProfile.nationality,
            
            // Position & Physical
            position: playerProfile.primaryPosition,
            height: playerProfile.height ? parseFloat(playerProfile.height.toString()) : null,
            weight: playerProfile.weight ? parseFloat(playerProfile.weight.toString()) : null,
            strongFoot: playerProfile.strongFoot,
            gender: playerProfile.gender,
            
            // Images - prioritize thumbNormalUrl
            imageUrl: playerProfile.thumbNormalUrl || 
                     playerProfile.thumbProfileUrl || 
                     playerProfile.thumbUrl || 
                     playerProfile.thumbIconUrl || 
                     null,
            profile: {
                thumbUrl: playerProfile.thumbUrl,
                thumbProfileUrl: playerProfile.thumbProfileUrl,
                thumbNormalUrl: playerProfile.thumbNormalUrl,
                thumbIconUrl: playerProfile.thumbIconUrl,
            },
            images,
            
            // Club & Contract
            club: playerProfile.club,
            league: playerProfile.league,
            contractExpiry: playerProfile.contractExpiry ? formatDate(new Date(playerProfile.contractExpiry)) : null,
            monthSalary: playerProfile.monthSalary,
            
            // Professional
            agentName: playerProfile.agentName,
            language: playerProfile.language,
            
            // Status & Ownership
            status: playerProfile.status,
            owner: playerProfile.owner,
            ownerId: playerProfile.ownerId,
            
            // Legacy
            playerId: playerProfile.playerId,
            
            // Relations
            clubMemberships: formattedMemberships,
            matchHistory: formattedMatches,
            
            // Metadata
            createdAt: formatDate(new Date(playerProfile.createdAt)),
        };

        res.status(200).json({status: "success", message: "Player profile fetched successfully", data: formattedProfile});
    } catch (error : any) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};

// search player profiles by parameters
export const searchPlayerProfiles = async (req : Request, res : Response) => {
    try {
        const {firstName, lastName, dateOfBirth, country} = req.query;
        
        // Build where clause conditionally
        const where: any = {};
        
        if (firstName && typeof firstName === 'string') {
            where.firstName = {contains: firstName, mode: 'insensitive'};
        }
        if (lastName && typeof lastName === 'string') {
            where.lastName = {contains: lastName, mode: 'insensitive'};
        }
        if (dateOfBirth && typeof dateOfBirth === 'string') {
            // Parse date string (expecting DD-MM-YYYY or YYYY-MM-DD format)
            const date = new Date(dateOfBirth);
            if (!isNaN(date.getTime())) {
                where.dateOfBirth = {equals: date};
            }
        }
        if (country && typeof country === 'string') {
            where.country = {contains: country, mode: 'insensitive'};
        }
        
        // Fetch player profiles with same fields as listPlayerProfiles
        const playerProfiles = await prisma.playerProfile.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                primaryPosition: true,
                city: true,
                state: true,
                country: true,
                dateOfBirth: true,
                thumbIconUrl: true,
                thumbNormalUrl: true,
                thumbProfileUrl: true,
                thumbUrl: true,
            },
            orderBy: {
                firstName: 'asc'
            }
        });

        // Format profiles same as listPlayerProfiles
        const formattedProfiles = playerProfiles.map((profile) => {
            // Build location string from city, state, country
            const locationParts = [profile.city, profile.state, profile.country].filter(Boolean);
            const location = locationParts.length > 0 ? locationParts.join(', ') : null;

            // Get primary image URL - prioritize thumbNormalUrl, then fallback to others
            const imageUrl = profile.thumbNormalUrl || 
                           profile.thumbProfileUrl || 
                           profile.thumbUrl || 
                           profile.thumbIconUrl || 
                           null;

            return {
                id: profile.id,
                name: `${profile.firstName} ${profile.lastName}`.trim(),
                position: profile.primaryPosition,
                location,
                age: calculateAge(profile.dateOfBirth),
                imageUrl, // Primary image for easy access
                profile: {
                    thumbUrl: profile.thumbUrl,
                    thumbProfileUrl: profile.thumbProfileUrl,
                    thumbNormalUrl: profile.thumbNormalUrl,
                    thumbIconUrl: profile.thumbIconUrl,
                },
            };
        });

        res.status(200).json({
            status: "success",
            message: "Player profiles searched successfully",
            data: formattedProfiles
        });
    } catch (error : any) {
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
            error: error.message || "Something went wrong"
        });
    }
};

// update a player profile
export const updatePlayerProfile = async (req : Request, res : Response) => {
    try {
        const {id} = req.params;
        const {firstName, lastName, dateOfBirth, country, avatar, primaryPosition} = req.body;
        
        // Check if player profile exists
        const existingProfile = await prisma.playerProfile.findUnique({where: {id}});
        if (!existingProfile) {
            return res.status(404).json({status: "error", message: "Player profile not found"});
        }
        
        // Prepare update data
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (country !== undefined) updateData.country = country;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (primaryPosition !== undefined) updateData.primaryPosition = primaryPosition;
        
        // Parse dateOfBirth from DD-MM-YYYY format
        if (dateOfBirth !== undefined) {
            const parsedDate = parseDate(dateOfBirth);
            if (parsedDate) {
                updateData.dateOfBirth = parsedDate;
            } else if (dateOfBirth !== null) {
                return res.status(400).json({status: "error", message: "Invalid date format. Expected DD-MM-YYYY"});
            } else {
                updateData.dateOfBirth = null;
            }
        }
        
        const playerProfile = await prisma.playerProfile.update({
            where: {id},
            data: updateData
        });
        
        // Format the response
        const formattedProfile = {
            ...playerProfile,
            dateOfBirth: playerProfile.dateOfBirth ? formatDate(new Date(playerProfile.dateOfBirth)) : null
        };
        
        res.status(200).json({status: "success", message: "Player profile updated successfully", data: formattedProfile});
    } catch (error : any) {
        res.status(500).json({status: "error", message: "Something went wrong", error: error.message || "Something went wrong"});
    }
};