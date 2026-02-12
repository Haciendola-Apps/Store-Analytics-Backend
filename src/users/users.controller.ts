import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('settings')
    async getSettings(@Request() req: any) {
        return this.usersService.getSettings(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('settings')
    async updateSettings(@Request() req: any, @Body() body: any) {
        return this.usersService.updateSettings(req.user.userId, body);
    }
}
