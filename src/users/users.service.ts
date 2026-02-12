import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserSetting } from './user-settings.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserSetting)
        private settingsRepository: Repository<UserSetting>,
    ) { }

    async findOne(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }

    async getSettings(userId: string): Promise<UserSetting> {
        let settings = await this.settingsRepository.findOne({ where: { user: { id: userId } } });
        
        if (!settings) {
            const user = await this.findById(userId);
            if (!user) throw new Error('User not found');
            
            settings = this.settingsRepository.create({
                user: user,
                currency: 'CLP',
                preferences: {}
            });
            await this.settingsRepository.save(settings);
        }
        
        return settings;
    }

    async updateSettings(userId: string, update: Partial<UserSetting>): Promise<UserSetting> {
        console.log(`Updating settings for user ${userId}:`, update);
        const settings = await this.getSettings(userId);
        Object.assign(settings, update);
        const saved = await this.settingsRepository.save(settings);
        console.log(`Settings saved for user ${userId}:`, saved);
        return saved;
    }
}
