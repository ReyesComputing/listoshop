/**
 * Servicio de pagos para ListoShop
 *
 * Arquitectura:
 *  1. El cliente llama a initiatePayment() → crea una referencia de pago
 *     y abre el flujo del gateway (Wompi / ePayco).
 *  2. El gateway envía un webhook al Edge Function de Supabase
 *     que llama a confirm_payment() en la base de datos.
 *  3. La app puede consultar el estado de la orden en tiempo real.
 *
 * En modo desarrollo (sin claves de gateway), se usa un simulador
 * que NO llega a producción (controlado por EXPO_PUBLIC_PAYMENT_MODE).
 */

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  message?: string;
}

const PAYMENT_MODE = process.env.EXPO_PUBLIC_PAYMENT_MODE || 'sandbox';

/**
 * Punto de entrada para iniciar el flujo de pago.
 * Redirige al gateway real o al simulador según EXPO_PUBLIC_PAYMENT_MODE.
 */
export async function initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
  if (PAYMENT_MODE === 'production') {
    return initiateWompiPayment(request);
  }
  // sandbox / development
  return simulatePayment(request);
}

// ─── Simulador (solo sandbox) ───────────────────────────────

async function simulatePayment(request: PaymentRequest): Promise<PaymentResult> {
  // Simular latencia de red
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // En sandbox siempre éxito para poder probar el flujo completo
  return {
    success: true,
    transactionId: `SANDBOX-${Date.now()}-${request.orderId.slice(0, 8)}`,
    message: 'Pago simulado (sandbox). En producción esto conecta con Wompi.',
  };
}

// ─── Wompi (producción) ─────────────────────────────────────

const WOMPI_PUBLIC_KEY = process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY || '';
const WOMPI_API_URL = 'https://production.wompi.co/v1';

async function initiateWompiPayment(request: PaymentRequest): Promise<PaymentResult> {
  if (!WOMPI_PUBLIC_KEY) {
    return { success: false, error: 'Clave pública de Wompi no configurada' };
  }

  try {
    // 1. Obtener acceptance token
    const merchantResp = await fetch(`${WOMPI_API_URL}/merchants/${WOMPI_PUBLIC_KEY}`);
    if (!merchantResp.ok) throw new Error('Error al consultar merchant de Wompi');
    const merchantData = await merchantResp.json();
    const acceptanceToken = merchantData.data.presigned_acceptance.acceptance_token;

    // 2. Crear transacción
    const txResp = await fetch(`${WOMPI_API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` },
      body: JSON.stringify({
        amount_in_cents: Math.round(request.amount * 100),
        currency: request.currency,
        customer_email: request.customerEmail,
        reference: request.orderId,
        acceptance_token: acceptanceToken,
      }),
    });

    if (!txResp.ok) {
      const err = await txResp.json();
      return { success: false, error: err.error?.message || 'Error al crear transacción en Wompi' };
    }

    const txData = await txResp.json();
    return {
      success: true,
      transactionId: txData.data.id,
      message: 'Transacción creada. Completa el pago en Wompi.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al conectar con Wompi';
    return { success: false, error: message };
  }
}
