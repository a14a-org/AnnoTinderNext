import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

export const authConfig = {
    providers: [
        Resend({
            from: process.env.EMAIL_FROM || "noreply@example.com",
            apiKey: process.env.RESEND_API_KEY,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
        verifyRequest: "/auth/verify-request",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    trustHost: true,
} satisfies NextAuthConfig;
