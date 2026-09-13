export interface PaymentRequest {
  amount: number; // Integer centavos
  orderId: string;
  method: 'card' | 'cash';
}

export interface PaymentResult {
  success: boolean;
  method: 'card' | 'cash';
  transactionId: string;
  authorizationCode?: string;
  message: string;
  timestamp: string;
}

export interface IPaymentReaderAdapter {
  processPayment(req: PaymentRequest): Promise<PaymentResult>;
}

export class MockPaymentReader implements IPaymentReaderAdapter {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();
    const txnId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    if (req.method === 'card') {
      // Simulate EMV / NFC tap processing latency
      console.log(`[PaymentReader] Processing CARD authorization for PHP ${(req.amount / 100).toFixed(2)}...`);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const authCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[PaymentReader] CARD APPROVED: Auth ${authCode}`);

      return {
        success: true,
        method: 'card',
        transactionId: txnId,
        authorizationCode: authCode,
        message: 'Payment Approved. Card transaction successful.',
        timestamp
      };
    } else {
      // Cash payment route
      console.log(`[PaymentReader] CASH ORDER registered for PHP ${(req.amount / 100).toFixed(2)}.`);
      return {
        success: true,
        method: 'cash',
        transactionId: txnId,
        message: 'Cash order registered. Please proceed to the cashier counter to pay.',
        timestamp
      };
    }
  }
}
