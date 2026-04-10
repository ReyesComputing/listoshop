/**
 * Simulated payment service for Wompi / ePayco integration
 */

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const simulatePayment = async (amount: number): Promise<PaymentResult> => {
  console.log(`Simulating payment for $${amount} COP...`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 95% success rate simulation
  const isSuccess = Math.random() > 0.05;

  if (isSuccess) {
    return {
      success: true,
      transactionId: `TX-${Math.random().toString(36).substring(7).toUpperCase()}`,
    };
  } else {
    return {
      success: false,
      error: 'La transacción fue rechazada por el banco emisor.',
    };
  }
};

/**
 * Empty functions for future real Wompi / ePayco integration
 */

export const initWompi = (publicKey: string) => {
  // TODO: Initialize Wompi SDK when ready
  console.log('Wompi initialized with key:', publicKey);
};

export const initEPayco = (publicKey: string) => {
  // TODO: Initialize ePayco SDK when ready
  console.log('ePayco initialized with key:', publicKey);
};
