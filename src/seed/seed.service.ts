import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        private readonly usersService: UsersService,
        private readonly analyticsService: AnalyticsService
    ) { }

    async onModuleInit() {
        await this.seedAdminUser();
        await this.analyticsService.seedSuccessConfigs();
    }

    async seedAdminUser() {
        const email = 'felipe@haciendola.com';
        const password = 'H4g4m053C0MM3RC3.2025*';

        const existingUser = await this.usersService.findOne(email);

        if (!existingUser) {
            console.log('Creating default admin user...');
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(password, salt);

            await this.usersService.create({
                email,
                password: hashedPassword,
                isActive: true,
            });
            console.log('Default admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }
    }
}
