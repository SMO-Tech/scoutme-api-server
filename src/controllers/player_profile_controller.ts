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
                profileType: true,
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
                profileType: profile.profileType,
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

// Helper function to track profile visit
async function trackProfileVisit(visitedProfileId: string, visitorUserId: string) {
    try {
        // Don't track if user is viewing their own profile
        const visitedProfile = await prisma.playerProfile.findUnique({
            where: { id: visitedProfileId },
            select: { ownerId: true }
        });

        if (visitedProfile?.ownerId === visitorUserId) {
            return; // Don't track self-visits
        }

        // Get visitor's player profile to get their profileType
        const visitorProfile = await prisma.playerProfile.findFirst({
            where: { ownerId: visitorUserId },
            select: { id: true, profileType: true }
        });

        // Record the visit
        await prisma.profileVisit.create({
            data: {
                visitedProfileId,
                visitorUserId,
                visitorProfileId: visitorProfile?.id || null,
                visitorProfileType: visitorProfile?.profileType || null,
            }
        });
    } catch (error: any) {
        // Silently fail visit tracking - don't break the main request
        console.error('Error tracking profile visit:', error.message);
    }
}

// Get a player profile by id
export const getPlayerProfileById = async (req : Request, res : Response) => {
    try {
        const {id} = req.params;
        console.log("id", id);
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
                }
            }
        });

        if (!playerProfile) {
            return res.status(404).json({status: "error", message: "Player profile not found"});
        }

        // Track visit if user is authenticated (from JWT token)
        if (req.user && req.user.uid) {
            // Find user by Firebase UID
            const visitorUser = await prisma.user.findUnique({
                where: { id: req.user.uid }
            });

            if (visitorUser) {
                // Track visit asynchronously (don't wait for it)
                trackProfileVisit(id, visitorUser.id).catch(console.error);
            }
        }

        const formattedProfile = {
            // Basic Info
            id: playerProfile.id,
            name: `${playerProfile.firstName} ${playerProfile.lastName}`.trim(),
            firstName: playerProfile.firstName,
            lastName: playerProfile.lastName,
            dateOfBirth: playerProfile.dateOfBirth ? formatDate(new Date(playerProfile.dateOfBirth)) : null,
            age: calculateAge(playerProfile.dateOfBirth),
            
            // Location
            location: `${playerProfile.city}, ${playerProfile.state}, ${playerProfile.country}`,
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

// Get profile visit analytics - who visited my profile
export const getProfileVisitAnalytics = async (req : Request, res : Response) => {
    try {
        // Get the authenticated user
        if (!req.user || !req.user.uid) {
            return res.status(401).json({status: "error", message: "Authentication required"});
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.uid },
            include: {
                ownedPlayers: {
                    select: { id: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({status: "error", message: "User not found"});
        }

        // Get all profiles owned by this user
        const profileIds = user.ownedPlayers.map(p => p.id);
        
        if (profileIds.length === 0) {
            return res.status(200).json({
                status: "success",
                message: "No profile visits found",
                data: {
                    todayStats: {},
                    recentVisits: [],
                    totalVisits: 0
                }
            });
        }

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's visits grouped by profile type
        const todayVisits = await prisma.profileVisit.findMany({
            where: {
                visitedProfileId: { in: profileIds },
                visitedAt: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                visitor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                visitorProfile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileType: true,
                        thumbNormalUrl: true,
                        thumbProfileUrl: true,
                        thumbUrl: true,
                        thumbIconUrl: true
                    }
                }
            },
            orderBy: {
                visitedAt: 'desc'
            }
        });

        // Group today's visits by profile type
        const todayStats: Record<string, any> = {};
        const visitsByType: Record<string, any[]> = {};

        todayVisits.forEach(visit => {
            const profileType = visit.visitorProfileType || 'Unknown';
            
            if (!todayStats[profileType]) {
                todayStats[profileType] = {
                    count: 0,
                    visitors: []
                };
                visitsByType[profileType] = [];
            }

            todayStats[profileType].count++;
            
            const visitorInfo = {
                userId: visit.visitor.id,
                name: visit.visitor.name,
                email: visit.visitor.email,
                phone: visit.visitor.phone,
                photoUrl: visit.visitor.photoUrl,
                profileId: visit.visitorProfile?.id || null,
                profileName: visit.visitorProfile ? `${visit.visitorProfile.firstName} ${visit.visitorProfile.lastName}`.trim() : null,
                profileType: visit.visitorProfileType,
                profileImageUrl: visit.visitorProfile?.thumbNormalUrl || 
                                visit.visitorProfile?.thumbProfileUrl || 
                                visit.visitorProfile?.thumbUrl || 
                                visit.visitorProfile?.thumbIconUrl || 
                                null,
                visitedAt: formatDate(new Date(visit.visitedAt))
            };

            // Only add if not already in list (unique visitors)
            const exists = visitsByType[profileType].some(v => v.userId === visitorInfo.userId);
            if (!exists) {
                visitsByType[profileType].push(visitorInfo);
                todayStats[profileType].visitors.push(visitorInfo);
            }
        });

        // Get recent visits (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentVisits = await prisma.profileVisit.findMany({
            where: {
                visitedProfileId: { in: profileIds },
                visitedAt: {
                    gte: thirtyDaysAgo
                }
            },
            include: {
                visitor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                visitorProfile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileType: true,
                        thumbNormalUrl: true,
                        thumbProfileUrl: true,
                        thumbUrl: true,
                        thumbIconUrl: true
                    }
                }
            },
            orderBy: {
                visitedAt: 'desc'
            },
            take: 50 // Last 50 visits
        });

        const formattedRecentVisits = recentVisits.map(visit => ({
            id: visit.id,
            visitor: {
                userId: visit.visitor.id,
                name: visit.visitor.name,
                email: visit.visitor.email,
                phone: visit.visitor.phone,
                photoUrl: visit.visitor.photoUrl,
            },
            visitorProfile: visit.visitorProfile ? {
                id: visit.visitorProfile.id,
                name: `${visit.visitorProfile.firstName} ${visit.visitorProfile.lastName}`.trim(),
                profileType: visit.visitorProfile.profileType,
                imageUrl: visit.visitorProfile.thumbNormalUrl || 
                         visit.visitorProfile.thumbProfileUrl || 
                         visit.visitorProfile.thumbUrl || 
                         visit.visitorProfile.thumbIconUrl || 
                         null
            } : null,
            visitedAt: formatDate(new Date(visit.visitedAt)),
            visitedAtRaw: visit.visitedAt
        }));

        // Get total visit count
        const totalVisits = await prisma.profileVisit.count({
            where: {
                visitedProfileId: { in: profileIds }
            }
        });

        res.status(200).json({
            status: "success",
            message: "Profile visit analytics fetched successfully",
            data: {
                todayStats: Object.keys(todayStats).map(type => ({
                    profileType: type,
                    count: todayStats[type].count,
                    uniqueVisitors: todayStats[type].visitors.length,
                    visitors: todayStats[type].visitors
                })),
                recentVisits: formattedRecentVisits,
                totalVisits
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

export const getMyProfile = async (req : Request, res : Response) => {
    try {
        if (!req.user || !req.user.uid) {
            return res.status(401).json({status: "error", message: "Authentication required"});
        }
        console.log("req.user", req.user);
        const user = await prisma.user.findUnique({where: {id: req.user.uid}});
        console.log("user", user);
        if (!user) {
            return res.status(404).json({status: "error", message: "User not found"});
        }

        if (!user.player_id) {
            return res.status(404).json({status: "error", message: "User does not have a linked player profile"});
        }

        // Use playerId (Int) to find PlayerProfile, not id (String)
        const playerProfile = await prisma.playerProfile.findFirst({
            where: {ownerId: user.id}
        });

        if (!playerProfile) {
            return res.status(404).json({status: "error", message: "Player profile not found for this user"});
        }

        res.status(200).json({
            status: "success", 
            message: "Player profile fetched successfully", 
            data: playerProfile
        });
    } catch (error : any) {
        res.status(500).json({
            status: "error", 
            message: "Something went wrong", 
            error: error.message || "Something went wrong"
        });
    }
};