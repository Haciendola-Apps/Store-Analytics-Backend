# Resumen del problema y solución

## Problema
Error: `duplicate key value violates unique constraint "UQ_1369326d345ca4074ec45.."`

El error ocurre al intentar resincronizar una tienda. Después de múltiples intentos, identifiqu é que:

1. El endpoint de sync devuelve éxito pero el error se produce internamente
2. El error persiste incluso después de eliminar todos los registros existentes
3. Esto sugiere que Shopify está devolviendo fechas duplicadas en la misma respuesta

## Soluciones intentadas
1. ✅ Mejorado el manejo de errores (controller y frontend)
2. ✅ Corregido el método syncStoreData para relanzar excepciones
3. ✅ Agregada deduplicación en ShopifyService
4. ✅ Cambiado de upsert a delete+insert
5. ⏳ Pendiente: Guardar uno por uno en lugar de bulk insert

## Próximos pasos
Cambiar el código en `store.service.ts` líneas 179-186 de:

```typescript
const metrics = sessionData.map((data: { date: string; sessions: number; conversionRate: number | null }) => this.sessionMetricRepository.create({
    date: data.date,
    sessions: data.sessions,
    conversionRate: data.conversionRate ?? undefined,
    store: store,
}));

await this.sessionMetricRepository.save(metrics);
```

A:

```typescript
// Save one by one to avoid bulk insert issues
for (const data of sessionData) {
    const metric = this.sessionMetricRepository.create({
        date: (data as any).date,
        sessions: (data as any).sessions,
        conversionRate: (data as any).conversionRate ?? undefined,
        store: store,
    });
    await this.sessionMetricRepository.save(metric);
}
```

## Cambio manual necesario
Por favor, realiza manualmente este cambio en el archivo `backend/src/store/store.service.ts` líneas 179-186.
