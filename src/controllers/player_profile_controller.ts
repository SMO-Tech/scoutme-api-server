import {Request, RequestHandler, Response} from "express";
import {prisma} from "../utils/db";
import { formatDate, parseDate } from "../utils/helper_functions";
import { PlayerProfile } from "@prisma/client";





// List all player profiles
export const listPlayerProfiles = async (req : Request, res : Response) => {
    try {
        const playerProfiles = await prisma.playerProfile.findMany();
        const formattedProfiles = playerProfiles.map((profile : PlayerProfile) => ({
            ...profile,
            dateOfBirth: profile.dateOfBirth ? formatDate(new Date(profile.dateOfBirth)) : null
        }));
        res.status(200).json({status: "success", message: "Player profiles listed successfully", data: formattedProfiles});
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
        const playerProfile = await prisma.playerProfile.findUnique({where: {
                id
            }});
        if (! playerProfile) {
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
            ... playerProfile,
            dateOfBirth: playerProfile.dateOfBirth ? formatDate(new Date(playerProfile.dateOfBirth)) : null
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
        console.log(req.query);
        console.log(firstName, lastName, dateOfBirth, country);
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
        
        const playerProfiles = await prisma.playerProfile.findMany({where});
        const formattedProfiles = playerProfiles.map((profile :PlayerProfile) => ({
            ...profile,
            dateOfBirth: profile.dateOfBirth ? formatDate(new Date(profile.dateOfBirth)) : null
        }));
        res.status(200).json({status: "success", message: "Player profiles searched successfully", data: formattedProfiles});
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