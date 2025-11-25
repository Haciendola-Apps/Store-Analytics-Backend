import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShopifyService {
    private readonly logger = new Logger(ShopifyService.name);

    constructor(private readonly httpService: HttpService) { }

    private formatStoreUrl(storeUrl: string): string {
        let url = storeUrl.trim();
        // Remove protocol to check for domain validity
        const noProtocol = url.replace(/^https?:\/\//, '');

        // If no dot, assume it's a store name and append .myshopify.com
        if (!noProtocol.includes('.')) {
            return `https://${noProtocol}.myshopify.com`;
        }

        // Ensure protocol is present
        return url.startsWith('http') ? url : `https://${url}`;
    }

    async getOrders(storeUrl: string, accessToken: string) {
        const baseUrl = this.formatStoreUrl(storeUrl);
        const url = `${baseUrl}/admin/api/2024-01/orders.json?status=any&limit=250`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }),
            );
            return data.orders;
        } catch (error) {
            this.logger.error(`Failed to fetch orders from ${baseUrl}`, error.response?.data || error.message);
            throw new Error(`Shopify API Error: ${error.message}`);
        }
    }

    async getProducts(storeUrl: string, accessToken: string) {
        const baseUrl = this.formatStoreUrl(storeUrl);
        const url = `${baseUrl}/admin/api/2024-01/products.json?limit=250`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }),
            );
            return data.products;
        } catch (error) {
            this.logger.error(`Failed to fetch products from ${baseUrl}`, error.response?.data || error.message);
            throw new Error(`Shopify API Error: ${error.message}`);
        }
    }
}
