import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { resend } from "./resend";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),

    emailAndPassword: {
        enabled: true,
    },

    user: {
        additionalFields: {
            expertise: {
                type: "string[]", // Attempting array support
                required: false,
                defaultValue: [],
                input: true,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "member",
                input: true,
            },
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },

    plugins: [
        organization({
            allowUserToCreateOrganization: false,
        }),
    ],

    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            await resend.emails.send({
                from: "The Coast <noreply@davidcoast.com>",
                to: user.email,
                subject: "Verify your email — The Coast",
                html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
            <h2 style="color: #0A0A0A; font-weight: 600; margin-bottom: 8px;">The Coast</h2>
            <p style="color: #737373; margin-bottom: 24px;">Verify your email to get started.</p>
            <a href="${url}" style="display: inline-block; background: #0A0A0A; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Verify Email
            </a>
          </div>
        `,
            });
        },
    },
});

export type Session = typeof auth.$Infer.Session;
