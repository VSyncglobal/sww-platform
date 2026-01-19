import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);

  constructor(private config: ConfigService) {}

  // Helper to ensure clean environment string
  private getEnv() {
    const env = this.config.get<string>('MPESA_ENV');
    return env ? env.toLowerCase().trim() : 'sandbox';
  }

  private async getAccessToken(): Promise<string> {
    const consumerKey = this.config.get<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.config.get<string>('MPESA_CONSUMER_SECRET');
    const env = this.getEnv();

    if (!consumerKey || !consumerSecret) {
      throw new Error('Missing M-Pesa Credentials in .env');
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // Correct URL Selection
    const baseUrl = env === 'production' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke';

    try {
      const { data } = await axios.get(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      return data.access_token;
    } catch (error) {
      this.logger.error('M-Pesa Token Error:', error.response?.data || error.message);
      throw new Error('M-Pesa Authentication Failed');
    }
  }

  async initiateSTKPush(phoneNumber: string, amount: number, accountReference: string) {
    const token = await this.getAccessToken();
    const env = this.getEnv();
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortcode = this.config.get<string>('MPESA_SHORTCODE');
    const passkey = this.config.get<string>('MPESA_PASSKEY');
    
    if (!passkey || !shortcode) throw new Error('Missing MPESA_SHORTCODE or MPESA_PASSKEY');

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const formattedPhone = phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber;
    
    const baseUrl = env === 'production' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke';

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${this.config.get('APP_URL')}/api/transactions/callback/mpesa`,
      AccountReference: accountReference,
      TransactionDesc: "Sacco Deposit"
    };

    try {
      const { data } = await axios.post(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Returns: { MerchantRequestID, CheckoutRequestID, ResponseCode, ... }
      return data;
    } catch (error) {
      this.logger.error('STK Push Error:', error.response?.data || error.message);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }
}