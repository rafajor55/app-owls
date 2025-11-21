/**
 * PLATFORM INTEGRATIONS - Gerenciador Central
 * 
 * Este arquivo centraliza todas as integrações com as plataformas de transporte
 * e fornece uma interface unificada para sincronização de dados.
 */

import { UberAPIClient, createUberClient, defaultUberConfig } from './uber-api';
import { NineNineAPIClient, createNineNineClient, NINENINE_INFO } from './99-api';
import { InDriverAPIClient, createInDriverClient, INDRIVER_INFO } from './indriver-api';
import { supabase } from '../supabase';

export type Platform = 'uber' | '99' | 'indriver';

export interface PlatformStatus {
  platform: Platform;
  name: string;
  isAvailable: boolean;
  hasPublicAPI: boolean;
  requiresPartnership: boolean;
  isConnected: boolean;
  lastSync?: Date;
}

export interface SyncResult {
  success: boolean;
  platform: Platform;
  ridesCount: number;
  errors?: string[];
}

/**
 * Gerenciador de integrações com plataformas
 */
export class PlatformIntegrationManager {
  private uberClient: UberAPIClient | null = null;
  private nineNineClient: NineNineAPIClient | null = null;
  private inDriverClient: InDriverAPIClient | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Inicializar cliente Uber
   */
  async initializeUber(customConfig?: any) {
    const config = customConfig || defaultUberConfig;
    this.uberClient = createUberClient(config);
    
    // Tentar carregar tokens salvos
    await this.uberClient.loadTokens(this.userId);
    
    return this.uberClient;
  }

  /**
   * Inicializar cliente 99
   */
  initializeNineNine(customConfig?: any) {
    this.nineNineClient = createNineNineClient(customConfig);
    return this.nineNineClient;
  }

  /**
   * Inicializar cliente InDriver
   */
  initializeInDriver(customConfig?: any) {
    this.inDriverClient = createInDriverClient(customConfig);
    return this.inDriverClient;
  }

  /**
   * Obter status de todas as plataformas
   */
  async getPlatformsStatus(): Promise<PlatformStatus[]> {
    const statuses: PlatformStatus[] = [];

    // Status Uber
    statuses.push({
      platform: 'uber',
      name: 'Uber',
      isAvailable: true,
      hasPublicAPI: true,
      requiresPartnership: true,
      isConnected: this.uberClient !== null,
    });

    // Status 99
    statuses.push({
      platform: '99',
      name: '99',
      isAvailable: false,
      hasPublicAPI: NINENINE_INFO.hasPublicAPI,
      requiresPartnership: NINENINE_INFO.requiresPartnership,
      isConnected: false,
    });

    // Status InDriver
    statuses.push({
      platform: 'indriver',
      name: 'InDriver',
      isAvailable: false,
      hasPublicAPI: INDRIVER_INFO.hasPublicAPI,
      requiresPartnership: INDRIVER_INFO.requiresPartnership,
      isConnected: false,
    });

    return statuses;
  }

  /**
   * Conectar plataforma (iniciar OAuth)
   */
  async connectPlatform(platform: Platform): Promise<string | null> {
    switch (platform) {
      case 'uber':
        if (!this.uberClient) {
          await this.initializeUber();
        }
        return this.uberClient!.getAuthorizationUrl();

      case '99':
        throw new Error(
          '99 não possui API pública. Use o sistema de entrada manual.'
        );

      case 'indriver':
        throw new Error(
          'InDriver não possui API pública. Use o sistema de entrada manual.'
        );

      default:
        throw new Error(`Plataforma desconhecida: ${platform}`);
    }
  }

  /**
   * Completar conexão OAuth (após callback)
   */
  async completeOAuthConnection(platform: Platform, code: string) {
    switch (platform) {
      case 'uber':
        if (!this.uberClient) {
          await this.initializeUber();
        }
        const tokens = await this.uberClient!.exchangeCodeForToken(code);
        await this.uberClient!.saveTokens(this.userId);
        return tokens;

      default:
        throw new Error(`OAuth não disponível para ${platform}`);
    }
  }

  /**
   * Sincronizar dados de uma plataforma específica
   */
  async syncPlatform(
    platform: Platform,
    startDate?: Date,
    endDate?: Date
  ): Promise<SyncResult> {
    try {
      switch (platform) {
        case 'uber':
          if (!this.uberClient) {
            throw new Error('Cliente Uber não inicializado');
          }
          const result = await this.uberClient.syncRidesToDatabase(
            this.userId,
            startDate,
            endDate
          );
          return {
            success: true,
            platform: 'uber',
            ridesCount: result.ridesCount,
          };

        case '99':
          throw new Error(
            '99 não possui API pública. Use entrada manual de dados.'
          );

        case 'indriver':
          throw new Error(
            'InDriver não possui API pública. Use entrada manual de dados.'
          );

        default:
          throw new Error(`Plataforma desconhecida: ${platform}`);
      }
    } catch (error) {
      return {
        success: false,
        platform,
        ridesCount: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      };
    }
  }

  /**
   * Sincronizar todas as plataformas conectadas
   */
  async syncAllPlatforms(
    startDate?: Date,
    endDate?: Date
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Sincronizar Uber se conectado
    if (this.uberClient) {
      const result = await this.syncPlatform('uber', startDate, endDate);
      results.push(result);
    }

    // 99 e InDriver não possuem API pública
    // Dados devem ser inseridos manualmente

    return results;
  }

  /**
   * Desconectar plataforma
   */
  async disconnectPlatform(platform: Platform) {
    // Remover tokens do banco de dados
    const { error } = await supabase
      .from('user_platform_tokens')
      .delete()
      .eq('user_id', this.userId)
      .eq('platform', platform);

    if (error) {
      throw new Error(`Erro ao desconectar ${platform}: ${error.message}`);
    }

    // Limpar cliente local
    switch (platform) {
      case 'uber':
        this.uberClient = null;
        break;
      case '99':
        this.nineNineClient = null;
        break;
      case 'indriver':
        this.inDriverClient = null;
        break;
    }
  }

  /**
   * Obter informações sobre como conectar cada plataforma
   */
  getConnectionInfo(platform: Platform) {
    switch (platform) {
      case 'uber':
        return {
          platform: 'Uber',
          available: true,
          steps: [
            '1. Crie uma conta de desenvolvedor em https://developer.uber.com',
            '2. Registre seu aplicativo e obtenha Client ID e Client Secret',
            '3. Configure o Redirect URI no dashboard da Uber',
            '4. Adicione as credenciais nas variáveis de ambiente',
            '5. Clique em "Conectar Uber" para iniciar OAuth',
          ],
          envVars: [
            'NEXT_PUBLIC_UBER_CLIENT_ID',
            'UBER_CLIENT_SECRET',
            'NEXT_PUBLIC_UBER_REDIRECT_URI',
          ],
        };

      case '99':
        return NINENINE_INFO;

      case 'indriver':
        return INDRIVER_INFO;

      default:
        throw new Error(`Plataforma desconhecida: ${platform}`);
    }
  }
}

/**
 * Criar gerenciador de integrações
 */
export function createPlatformManager(userId: string): PlatformIntegrationManager {
  return new PlatformIntegrationManager(userId);
}

/**
 * Verificar disponibilidade geral das APIs
 */
export function checkAPIsAvailability() {
  return {
    uber: {
      available: true,
      hasPublicAPI: true,
      requiresPartnership: true,
      status: 'API disponível com OAuth',
    },
    '99': {
      available: false,
      hasPublicAPI: false,
      requiresPartnership: true,
      status: 'API privada - requer parceria',
    },
    indriver: {
      available: false,
      hasPublicAPI: false,
      requiresPartnership: true,
      status: 'API privada - requer parceria',
    },
    recommendation:
      'Use o sistema de entrada manual para 99 e InDriver. ' +
      'Para Uber, configure OAuth seguindo a documentação.',
  };
}
