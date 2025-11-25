import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('stores')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Post()
    create(@Body() body: { url: string; accessToken: string; name: string }) {
        return this.storeService.create(body.url, body.accessToken, body.name);
    }

    @Get()
    findAll() {
        return this.storeService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.storeService.findOne(id);
    }

    @Post(':id/sync')
    async sync(@Param('id') id: string) {
        const store = await this.storeService.findOne(id);
        this.storeService.syncStoreData(store); // Async
        return { message: 'Sync started' };
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.storeService.remove(id);
    }
}
