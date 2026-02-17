import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

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
                type: "string[]",
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
});

export type Session = typeof auth.$Infer.Session;
