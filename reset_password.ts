
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    });

    if (admin) {
        console.log(`ADMIN_EMAIL: ${admin.email}`);
        // Hash "password123"
        const hashedPassword = await bcrypt.hash('password123', 10);

        await prisma.user.update({
            where: { id: admin.id },
            data: { password: hashedPassword },
        });
        console.log("ADMIN_PASSWORD_RESET_SUCCESS: password123");
    } else {
        // If no admin, find the user from the screenshot and promote them
        const user = await prisma.user.findFirst({
            where: { email: 'ab588538@gmail.com' }
        });

        if (user) {
            console.log(`Found user ${user.email}, promoting to ADMIN and resetting password.`);
            const hashedPassword = await bcrypt.hash('password123', 10);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: 'ADMIN',
                    password: hashedPassword
                }
            });
            console.log("USER_PROMOTED_AND_RESET: password123");
        } else {
            console.log("No user found to reset.");
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
