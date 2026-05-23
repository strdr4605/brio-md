import { z } from 'zod';
import { router, protectedProcedure, superProcedure } from '../trpc';
import { eq, ilike } from 'drizzle-orm';
import { users } from '@/db/schema';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    const userId = parseInt(ctx.user.id);
    return { ...ctx.user, id: userId };
  }),
  
  // List users (filtered by permissions)
  list: protectedProcedure.input(
    z.object({
      search: z.string().optional(),
      schoolId: z.number().optional(),
      role: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional()
  ).query(async ({ ctx, input }) => {
    if (!ctx.user) return [];
    const user = ctx.user;
    const permissions = user.permissions || [];
    
    // Build conditions based on role
    const conditions = [];
    
    if (!permissions.includes('super')) {
      if (permissions.includes('admin')) {
        // Admins see users in their school
        if (user.schoolId) {
          conditions.push(eq(users.schoolId, user.schoolId));
        } else {
          return [];
        }
      } else {
        // Others see only themselves
        return [{
          id: parseInt(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          courseIds: user.courseIds,
          schoolId: user.schoolId,
          active: true,
        }];
      }
    }
    
    // Apply filters
    if (input?.search) {
      conditions.push(ilike(users.name, `%${input.search}%`));
    }
    if (input?.schoolId) {
      conditions.push(eq(users.schoolId, input.schoolId));
    }
    if (input?.role) {
      conditions.push(eq(users.role, input.role));
    }
    
    // For now, return mock data since db is not connected
    return [];
  }),
  
  // Get user by ID
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    const user = ctx.user;
    const permissions = user.permissions || [];
    
    // Check permissions
    if (!permissions.includes('super')) {
      if (permissions.includes('admin')) {
        // Admin can only view users in their school (mock)
        if (input.id !== parseInt(user.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot view this user' });
        }
      } else {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot view users' });
      }
    }
    
    return null; // Mock
  }),
  
  // Create user (SuperAdmin only)
  create: superProcedure.input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      role: z.enum(['superadmin', 'admin', 'teacher']),
      permissions: z.array(z.string()),
      courseIds: z.array(z.number()).optional(),
      schoolId: z.number().nullable().optional(),
      phone: z.string().optional(),
      info: z.string().optional(),
    })
  ).mutation(async ({ input }) => {
    // Mock implementation - will connect to DB later
    return {
      id: 1,
      ...input,
      active: true,
    };
  }),
  
  // Update user (SuperAdmin only)
  update: superProcedure.input(
    z.object({
      id: z.number(),
      email: z.string().email().optional(),
      name: z.string().min(1).optional(),
      role: z.enum(['superadmin', 'admin', 'teacher']).optional(),
      permissions: z.array(z.string()).optional(),
      courseIds: z.array(z.number()).optional(),
      schoolId: z.number().nullable().optional(),
      active: z.boolean().optional(),
    })
  ).mutation(async ({ input }) => {
    const { id, ...updates } = input;
    return { id, ...updates };
  }),
  
  // List schools
  listSchools: protectedProcedure.query(async () => {
    // Mock
    return [{ id: 1, name: 'Vibe Academy' }];
  }),
  
  // List courses
  listCourses: protectedProcedure.input(
    z.object({
      schoolId: z.number().optional(),
    }).optional()
  ).query(async () => {
    // Mock
    return [{ id: 1, name: 'English' }];
  }),
});