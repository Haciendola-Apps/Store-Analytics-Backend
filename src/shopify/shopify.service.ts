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



    async getDailyAnalytics(storeUrl: string, accessToken: string, since: string, until: string) {
        // ShopifyQL query
        const shopifyQLQuery = `FROM sales, sessions SHOW day, total_sales, orders, average_order_value, conversion_rate, sessions GROUP BY day SINCE ${since} UNTIL ${until} ORDER BY day ASC`;

        const query = `
            query getDailyAnalytics {
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
                    parseErrors
                }
            }
        `;

        this.logger.log(`[${storeUrl}] ShopifyQL Query: ${shopifyQLQuery}`);

        try {
            //lets do the fetch right here witouth dependint on other methods

            const response = await fetch(`https://${storeUrl}/admin/api/2026-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            const data = await response.json();
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const tableData = data.data.shopifyqlQuery.tableData;
            if (!tableData || !tableData.rows) {
                this.logger.warn(`[${storeUrl}] No analytics data returned from ShopifyQL`);
                return [];
            }

            this.logger.log(`[${storeUrl}] Fetched ${tableData.rows.length} rows from ShopifyQL`);

            return tableData.rows.map((row: any) => {
                const isArray = Array.isArray(row);
                return {
                    date: isArray ? row[0] : row.day,
                    totalSales: parseFloat((isArray ? row[1] : row.total_sales) || '0'),
                    orders: parseInt((isArray ? row[2] : row.orders) || '0'),
                    averageOrderValue: parseFloat((isArray ? row[3] : row.average_order_value) || '0'),
                    conversionRate: parseFloat((isArray ? row[4] : row.conversion_rate) || '0'),
                    sessions: parseInt((isArray ? row[5] : row.sessions) || '0'),
                };
            });

        } catch (error) {
            this.logger.error(`[${storeUrl}] Failed to fetch daily analytics`, error.message);
            throw error;
        }
    }

    async getProductAnalytics(storeUrl: string, accessToken: string, since: string, until: string) {
        // ShopifyQL query
        const shopifyQLQuery = `FROM sales SHOW day, product_title, product_id, total_sales, net_sales, net_items_sold GROUP BY day, product_id, product_title SINCE ${since} UNTIL ${until} ORDER BY day ASC`;

        const query = `
            query getProductAnalytics {
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
                    parseErrors
                }
            }
        `;

        this.logger.log(`[${storeUrl}] ShopifyQL Product Query: ${shopifyQLQuery}`);

        try {
            const response = await fetch(`https://${storeUrl}/admin/api/2026-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            const data = await response.json();
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const tableData = data.data.shopifyqlQuery.tableData;
            if (!tableData || !tableData.rows) {
                this.logger.warn(`[${storeUrl}] No product analytics data returned from ShopifyQL`);
                return [];
            }

            this.logger.log(`[${storeUrl}] Fetched ${tableData.rows.length} product rows from ShopifyQL`);

            // Parse rows. Expected order:
            // day, product_title, product_id, total_sales, net_sales, net_items_sold

            return tableData.rows.map((row: any) => {
                const isArray = Array.isArray(row);
                return {
                    date: isArray ? row[0] : row.day,
                    productTitle: isArray ? row[1] : row.product_title,
                    productId: isArray ? row[2] : row.product_id,
                    totalSales: parseFloat((isArray ? row[3] : row.total_sales) || '0'),
                    netSales: parseFloat((isArray ? row[4] : row.net_sales) || '0'),
                    netItemsSold: parseInt((isArray ? row[5] : row.net_items_sold) || '0'),
                };
            });

        } catch (error) {
            this.logger.error(`[${storeUrl}] Failed to fetch product analytics`, error.message);
            throw error;
        }
    }
}
