import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, magicLink, organization } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { and, desc, eq, isNotNull } from 'drizzle-orm'

import { member, session as sessionTable } from '@template/database/schema'
import { db } from '@template/database'
import { diContainer } from './di.ts'

async function getActiveOrganization(userId: string) {
  // First, try to get the most recent session's active organization
  const previousSession = await db.query.session.findFirst({
    where: and(
      eq(sessionTable.userId, userId),
      isNotNull(sessionTable.activeOrganizationId),
    ),
    orderBy: desc(sessionTable.createdAt),
  })

  if (previousSession?.activeOrganizationId) {
    // Verify the user still has access to this organization
    const membershipExists = await db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, previousSession.activeOrganizationId),
      ),
    })

    if (membershipExists) {
      return previousSession.activeOrganizationId
    }
  }

  // If no previous active org, get their most recent organization membership
  const recentMembership = await db.query.member.findFirst({
    where: eq(member.userId, userId),
    orderBy: desc(member.createdAt),
  })

  return recentMembership?.organizationId || null
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg', // or "mysql", "sqlite"
  }),
  baseURL: 'http://localhost:3001',
  trustedOrigins: (request) => {
    // const origin = request?.headers?.get('origin')
    // Allow requests with no origin (mobile apps) or no request object
    // if (!origin) return true
    // Allow specific origins
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      'mega://',
      'exp://',
      'exp://**',
    ]

    return allowed
  },
  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        // Log both URLs - use the appropriate one based on platform
        const mobileUrl = `mega://callback?token=${token}`
        console.log(`Magic link for ${email}:`)
        console.log(`  Web: ${url}`)
        console.log(`  Mobile: ${mobileUrl}`)
      },
    }),
    organization({
      sendInvitationEmail: async (
        { email, invitation, organization },
        request,
      ) => {
        console.log(
          `Send invitation email to ${email} for organization ${organization.id}`,
        )
      },
    }),
    admin(),
  ],

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeOrgId = await getActiveOrganization(session.userId)
          return {
            data: {
              ...session,
              activeOrganizationId: activeOrgId,
            },
          }
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: 'uuid',
    },
    crossSubDomainCookies: {
      enabled: true,
    },
  },
})

export type AuthService = typeof auth
export const authSybmol = Symbol.for('AuthService')
diContainer.bind<AuthService>(authSybmol).toConstantValue(auth)
