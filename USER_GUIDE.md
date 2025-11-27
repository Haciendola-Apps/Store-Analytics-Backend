# Guía de Usuario - Hagamos Ecommerce Analytics

Bienvenido a la aplicación de análisis para tiendas Shopify. Esta guía te ayudará a configurar tus tiendas y visualizar tus métricas clave.

## Paso 1: Preparación en Shopify

Antes de usar la aplicación, necesitas obtener las credenciales de acceso de tu tienda Shopify.

1.  Ingresa al panel de administración de tu tienda Shopify (ej. `tutienda.myshopify.com/admin`).
2.  Ve a **Configuración** (Settings) > **Apps y canales de ventas** (Apps and sales channels).
3.  Haz clic en **Desarrollar apps** (Develop apps).
4.  Haz clic en **Crear una app** (Create an app).
5.  Dale un nombre a la app (ej. "Analytics Dashboard") y selecciona tu usuario como desarrollador.
6.  Haz clic en **Configurar alcances de la API del panel de control** (Configure Admin API scopes).
7.  Busca y marca los siguientes permisos de **lectura** (read access):
    *   `read_orders` (para ver ventas y pedidos)
    *   `read_products` (para ver productos top)
    *   `read_customers` (para métricas de clientes)
8.  Haz clic en **Guardar** (Save) e **Instalar app** (Install app).
9.  Una vez instalada, ve a la pestaña **Credenciales de la API** (API credentials).
10. **Copia y guarda** el **Token de acceso de la API del panel de control** (Admin API access token). Este comienza generalmente con `shpat_...`.
    *   *Nota: Solo podrás ver este token una vez.*
11. Copia también la **URL de tu tienda** (ej. `tutienda.myshopify.com`).

## Paso 2: Agregar una Tienda en la App

1.  Abre la aplicación **Hagamos Ecommerce Analytics**.
2.  En el **Header** (barra superior) o en el menú lateral, busca y haz clic en el botón **"+ Add Store"**.
3.  Se abrirá un panel lateral para ingresar los datos.

## Paso 3: Configuración de la Tienda

En el formulario de "Add Store", ingresa la siguiente información:

1.  **Store Name**: Un nombre para identificar tu tienda (ej. "Mi Tienda Principal").
2.  **Shopify URL**: La dirección de tu tienda (ej. `tutienda.myshopify.com`).
3.  **API Access Token**: Pega aquí el token que copiaste en el Paso 1 (`shpat_...`).
4.  **Reference Period (Período de Referencia)**:
    *   Estas fechas son clave para el gráfico de análisis.
    *   **Start Date**: Selecciona la fecha de inicio del programa de acompañamiento.
    *   **End Date**: Selecciona la fecha de fin del programa.
    *   *Estos puntos se marcarán visualmente en tus gráficos para medir el impacto del programa.*
5.  Haz clic en **"Add Store"**.

La aplicación intentará conectar con tu tienda y comenzará a sincronizar los datos históricos. Verás un indicador de estado (ej. "Syncing..." o "Synced").

## Paso 4: Visualización y Análisis

Una vez que la tienda está sincronizada:

1.  **Seleccionar Tienda**: Si tienes varias tiendas, asegúrate de que la tienda correcta esté seleccionada en el menú desplegable del Header (arriba a la izquierda, junto a "Dashboard").
2.  **Seleccionar Rango de Fechas de Análisis**:
    *   En el **Header** (parte superior derecha), verás un selector de fechas.
    *   Haz clic y selecciona el rango de tiempo que quieres analizar (ej. "Last 30 days", "This Month", o un rango personalizado).
    *   *Nota: Este selector es persistente. Si cambias de sección (ej. de Overview a Analytics), la fecha seleccionada se mantiene.*
3.  **Ver el Gráfico de Rendimiento**:
    *   Navega a la sección **Analytics** en el menú lateral.
    *   Observarás el gráfico de "Revenue Overview".
    *   **Línea de Referencia**: Fíjate en la línea del gráfico. El tramo que corresponde a las fechas de tu "Reference Period" (configurado en el Paso 3) se mostrará en un **color azul claro destacado**, con puntos marcando el inicio y el fin.
    *   Esto te permite comparar visualmente cómo se comportaron las ventas durante el período de acompañamiento frente al resto del tiempo seleccionado.

---
*Documento generado para Hagamos Ecommerce Analytics*
