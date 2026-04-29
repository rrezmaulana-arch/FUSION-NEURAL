/// <reference types="node" />
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const payload = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-umbvOIGiXz0anZS1FkQBIbKQ';
    const encodedKey = btoa(serverKey + ':');

    // Force sandbox for now
    const apiUrl = 'https://api.sandbox.midtrans.com/v2/charge';

    const chargePayload: any = {
      payment_type: payload.payment_type,
      transaction_details: {
        order_id: payload.order_id,
        gross_amount: payload.gross_amount
      },
      customer_details: {
        first_name: payload.first_name,
        phone: payload.phone
      }
    };

    if (payload.payment_type === 'bank_transfer') {
      chargePayload.bank_transfer = {
        bank: payload.bank || 'bca'
      };
    } else if (payload.payment_type === 'echannel') {
      chargePayload.echannel = {
        bill_info1: 'Payment For',
        bill_info2: 'FusionNeural'
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedKey}`
      },
      body: JSON.stringify(chargePayload)
    });

    const data = await response.json();

    if (!response.ok || data.status_code !== '201') {
      console.error('Midtrans Core API Error:', data);
      return new Response(JSON.stringify({ error: data }), { status: 400 });
    }

    // Extract necessary info
    let result: any = {
      order_id: data.order_id,
      gross_amount: data.gross_amount,
      payment_type: data.payment_type,
      transaction_status: data.transaction_status
    };

    if (payload.payment_type === 'bank_transfer') {
      result.va_number = data.va_numbers[0].va_number;
      result.bank = data.va_numbers[0].bank;
    } else if (payload.payment_type === 'echannel') {
      result.biller_code = data.biller_code;
      result.bill_key = data.bill_key;
      result.bank = 'mandiri';
    } else if (payload.payment_type === 'qris' || payload.payment_type === 'gopay') {
      const qrAction = data.actions?.find((action: any) => action.name === 'generate-qr-code');
      result.qr_url = qrAction ? qrAction.url : '';
      result.actions = data.actions;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
