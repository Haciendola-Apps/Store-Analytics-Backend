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

    private async executeGraphQL(storeUrl: string, accessToken: string, query: string): Promise<any> {
        const baseUrl = this.formatStoreUrl(storeUrl);
        // Use 2024-01 version to match REST API and ensure compatibility
        const url = `${baseUrl}/admin/api/2024-01/graphql.json`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.post(url, { query }, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }),
            );

            if (data.errors) {
                // Check if it's a "Field doesn't exist" error (ShopifyQL not supported)
                const isUndefinedField = data.errors.some((e: any) => e.extensions?.code === 'undefinedField');

                if (isUndefinedField) {
                    this.logger.warn(`ShopifyQL not supported by this store/API version: ${JSON.stringify(data.errors[0].message)}`);
                    return { shopifyqlQuery: { tableData: { rows: [] } } }; // Return empty structure
                }

                this.logger.error('GraphQL errors:', JSON.stringify(data.errors));
                throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
            }

            return data.data;
        } catch (error) {
            this.logger.error(`Failed to execute GraphQL query on ${baseUrl}`, error.response?.data || error.message);
            throw new Error(`Shopify GraphQL Error: ${error.message}`);
        }
    }

    async getSessionMetrics(storeUrl: string, accessToken: string, startDate: string, endDate: string) {
        // ShopifyQL query - note: we need to be careful with the date format
        const shopifyQLQuery = `FROM sessions SHOW conversion_rate, sessions GROUP BY day SINCE '${startDate}' UNTIL '${endDate}' ORDER BY day ASC`;
        console.log('shopifyQLQuery', shopifyQLQuery);
        const query = `
            query getSessionMetrics {
                shopifyqlQuery(
                    query: """${shopifyQLQuery}"""
                ) {
                    tableData {
                        columns {
                            name
                            dataType
                        }
                        rows
                    }
                    parseErrors {
                        code
                        message
                        range {
                            start { line character }
                            end { line character }
                        }
                    }
                }
            }
        `;

        this.logger.log(`ShopifyQL Query: ${shopifyQLQuery}`);

        try {
            const result = await this.executeGraphQL(storeUrl, accessToken, query);

            if (result.shopifyqlQuery?.parseErrors && result.shopifyqlQuery.parseErrors.length > 0) {
                const errors = result.shopifyqlQuery.parseErrors;
                this.logger.error('ShopifyQL parse errors:', JSON.stringify(errors));
                throw new Error(`ShopifyQL Error: ${errors[0].message}`);
            }

            const tableData = result.shopifyqlQuery?.tableData;
            if (!tableData || !tableData.rows) {
                this.logger.warn('No session data returned from ShopifyQL');
                return [];
            }

            this.logger.log(`Fetched ${tableData.rows.length} rows from ShopifyQL`);

            // Parse the rows - format: [date, conversion_rate, sessions]
            const parsedData = tableData.rows.map((row: any[]) => ({
                date: row[0], // day
                conversionRate: row[1] !== null ? parseFloat(row[1]) : null,
                sessions: row[2] !== null ? parseInt(row[2]) : 0,
            }));

            // Deduplicate by date (in case Shopify returns duplicates)
            const uniqueData = Array.from(
                new Map(parsedData.map((item: { date: string; conversionRate: number | null; sessions: number }) => [item.date, item])).values()
            );

            if (uniqueData.length !== parsedData.length) {
                this.logger.warn(`Removed ${parsedData.length - uniqueData.length} duplicate date entries from Shopify data`);
            }

            return uniqueData;
        } catch (error) {
            this.logger.error(`Failed to fetch session metrics`, error.message);
            throw error;
        }
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
