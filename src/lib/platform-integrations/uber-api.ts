/**
 * UBER API INTEGRATION
 * 
 * Implementação da integração com a API da Uber
 * Documentação: https://developer.uber.com/docs/riders/introduction
 * 
 * REQUISITOS:
 * - Conta de desenvolvedor Uber
 * - Client ID e Client Secret
 * - Configurar OAuth 2.0
 * - Permissões: rides, profile
 */

import { supabase } from '../supabase';

export interface UberConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface UberRide {
  request_id: string;
  status: string;
  product_id: string;
  driver: {
    name: string;
    phone_number: string;
    rating: number;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  fare: {
    amount: number;
    currency: string;
  };
  distance: number;
  duration: number;
}

export interface UberTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export class UberAPIClient {
  private config: UberConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl = 'https://api.uber.com';

  constructor(config: UberConfig) {
    this.config = config;
  }

  /**
   * PASSO 1: Gerar URL de autorização OAuth
   * Redireciona o usuário para fazer login na Uber
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
    });

    return `https://login.uber.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * PASSO 2: Trocar código de autorização por token de acesso
   * Após o usuário autorizar, a Uber retorna um código
   */
  async exchangeCodeForToken(code: string): Promise<UberTokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    return data;
  }

  /**
   * PASSO 3: Renovar token de acesso usando refresh token
   */
  async refreshAccessToken(): Promise<UberTokenResponse> {
    if (!this.refreshToken) {
      throw new Error('Refresh token não disponível');
    }

    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao renovar token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    return data;
  }

  /**
   * Definir token de acesso manualmente
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Fazer requisição autenticada à API da Uber
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Token de acesso não disponível. Faça login primeiro.');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expirado, tentar renovar
      await this.refreshAccessToken();
      return this.makeAuthenticatedRequest(endpoint, options);
    }

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Buscar histórico de corridas
   * Endpoint: GET /v1.2/history
   */
  async fetchRideHistory(
    offset: number = 0,
    limit: number = 50
  ): Promise<UberRide[]> {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });

    const data = await this.makeAuthenticatedRequest(
      `/v1.2/history?${params.toString()}`
    );

    return data.history || [];
  }

  /**
   * Buscar detalhes de uma corrida específica
   * Endpoint: GET /v1.2/requests/{request_id}
   */
  async fetchRideDetails(requestId: string): Promise<UberRide> {
    return this.makeAuthenticatedRequest(`/v1.2/requests/${requestId}`);
  }

  /**
   * Buscar perfil do usuário
   * Endpoint: GET /v1.2/me
   */
  async fetchUserProfile(): Promise<any> {
    return this.makeAuthenticatedRequest('/v1.2/me');
  }

  /**
   * Sincronizar corridas com o banco de dados
   */
  async syncRidesToDatabase(userId: string, startDate?: Date, endDate?: Date) {
    try {
      // Buscar histórico de corridas
      const rides = await this.fetchRideHistory();

      // Filtrar por data se fornecido
      let filteredRides = rides;
      if (startDate || endDate) {
        filteredRides = rides.filter((ride) => {
          const rideDate = new Date(ride.request_id); // Ajustar conforme formato real
          if (startDate && rideDate < startDate) return false;
          if (endDate && rideDate > endDate) return false;
          return true;
        });
      }

      // Inserir no banco de dados
      const ridesToInsert = filteredRides.map((ride) => ({
        user_id: userId,
        platform: 'uber' as const,
        date: new Date().toISOString(), // Ajustar para data real da corrida
        value: ride.fare.amount,
        distance: ride.distance,
        duration: ride.duration,
        category: ride.product_id,
        bonus: 0,
        multiplier: 1,
        total_earnings: ride.fare.amount,
      }));

      const { data, error } = await supabase
        .from('rides')
        .insert(ridesToInsert);

      if (error) {
        throw new Error(`Erro ao salvar corridas: ${error.message}`);
      }

      return {
        success: true,
        ridesCount: ridesToInsert.length,
        data,
      };
    } catch (error) {
      console.error('Erro ao sincronizar corridas:', error);
      throw error;
    }
  }

  /**
   * Salvar tokens no banco de dados (criptografados)
   */
  async saveTokens(userId: string) {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('Tokens não disponíveis');
    }

    // Aqui você deve implementar criptografia dos tokens
    // Por segurança, NUNCA salve tokens em texto plano
    const { error } = await supabase
      .from('user_platform_tokens')
      .upsert({
        user_id: userId,
        platform: 'uber',
        access_token: this.accessToken, // CRIPTOGRAFAR!
        refresh_token: this.refreshToken, // CRIPTOGRAFAR!
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Erro ao salvar tokens: ${error.message}`);
    }
  }

  /**
   * Carregar tokens do banco de dados
   */
  async loadTokens(userId: string) {
    const { data, error } = await supabase
      .from('user_platform_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'uber')
      .single();

    if (error || !data) {
      return false;
    }

    // Descriptografar tokens
    this.accessToken = data.access_token; // DESCRIPTOGRAFAR!
    this.refreshToken = data.refresh_token; // DESCRIPTOGRAFAR!

    return true;
  }
}

/**
 * Função auxiliar para inicializar cliente Uber
 */
export function createUberClient(config: UberConfig): UberAPIClient {
  return new UberAPIClient(config);
}

/**
 * Configuração padrão (use variáveis de ambiente)
 */
export const defaultUberConfig: UberConfig = {
  clientId: process.env.NEXT_PUBLIC_UBER_CLIENT_ID || '',
  clientSecret: process.env.UBER_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_UBER_REDIRECT_URI || '',
  scopes: ['profile', 'history', 'history_lite'],
};
