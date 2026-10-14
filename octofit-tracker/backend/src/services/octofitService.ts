import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (!userId || !teamId || typeof type !== 'string' || !type.trim() || minutes === undefined || minutes === null) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('userId must be a valid ObjectId'), { status: 400 });
  }

  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('teamId must be a valid ObjectId'), { status: 400 });
  }

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Referenced user and team must exist'), { status: 400 });
  }

  const activity = await Activity.create({
    user: new mongoose.Types.ObjectId(userId),
    team: new mongoose.Types.ObjectId(teamId),
    type: type.trim(),
    minutes: numericMinutes,
    points: Math.max(1, Math.round(numericMinutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('name and mascot are required'), { status: 400 });
  }

  if (members !== undefined && members !== null && !Array.isArray(members)) {
    throw Object.assign(new Error('members must be an array of ObjectIds'), { status: 400 });
  }

  const validMembers = Array.isArray(members) ? members.map((member) => {
    const memberId = typeof member === 'string' ? member : (member as { toString?: () => string })?.toString?.();
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      throw Object.assign(new Error('members must contain valid ObjectIds'), { status: 400 });
    }
    return new mongoose.Types.ObjectId(memberId);
  }) : [];

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: validMembers });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return teams.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focusFromType = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('run')) return 'endurance';
    if (normalized.includes('strength')) return 'strength';
    if (normalized.includes('cycle') || normalized.includes('ride')) return 'endurance';
    if (normalized.includes('walk') || normalized.includes('mobility')) return 'mobility';
    return 'endurance';
  };

  const focus = recentActivity[0]?.type ? focusFromType(recentActivity[0].type) : (typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : 'endurance');
  const matches = await Workout.find({ focus }).sort({ minutes: 1 }).lean();

  const fallback = await Workout.find().sort({ minutes: 1 }).lean();
  const suggestions = (matches.length > 0 ? matches : fallback).slice(0, 3).map((workout) => ({
    ...workout,
    reason: recentActivity[0]
      ? `Matched your recent ${recentActivity[0].type} activity and ${focus} goal.`
      : `Matched your ${user.fitnessGoal ?? 'fitness'} goal and activity pattern.`,
  }));

  return suggestions;
}

export { User };
