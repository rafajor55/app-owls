/**
 * 99 API INTEGRATION
 * 
 * ⚠️ IMPORTANTE: A 99 NÃO possui API pública documentada
 * 
 * Esta implementação é uma estrutura preparada para quando/se a 99 liberar API
 * ou para integração via parceria corporativa.
 * 
 * ALTERNATIVAS ATUAIS:
 * 1. Entrada manual de dados pelo motorista
 * 2. Aguardar parceria corporativa com a 99
 * 3. Aguardar liberação de API pública
 * 
 * CONTATO PARA PARCERIA:
 * - Site: https://99app.com/
 * - Suporte: Através do app ou site oficial
 */

import { supabase } from '../supabase';

export interface NineNineConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
}

export interface NineNineRide {
  id: string;
  date: string;
  value: number;
  distance?: number;
  duration?: number;
  category?: string;
  bonus?: number;
}

export class NineNineAPIClient {
  private config: NineNineConfig;
  private isAvailable = false;

  constructor(config: NineNineConfig = {}) {
    this.config = config;
  }

  /**
   * Verificar se a API está disponível
   */
  checkAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Buscar histórico de corridas (preparado para futuro)
   */
  async fetchRideHistory(
    startDate: Date,
    endDate: Date
  ): Promise<NineNineRide[]> {
    if (!this.isAvailable) {
      throw new Error(
        '99 API não está disponível. ' +
        'A 99 não possui API pública para motoristas. ' +
        'Para integração, é necessário parceria corporativa. ' +
        'Continue usando o sistema de entrada manual de dados.'
      );
    }

    // Implementação futura quando API estiver disponível
    throw new Error('Implementação pendente - aguardando API da 99');
  }

  /**
   * Sincronizar corridas com o banco de dados (preparado para futuro)
   */
  async syncRidesToDatabase(userId: string, startDate?: Date, endDate?: Date) {
    if (!this.isAvailable) {
      throw new Error(
        'Sincronização automática não disponível para 99. ' +
        'Use o sistema de entrada manual.'
      );
    }

    // Implementação futura
    throw new Error('Implementação pendente - aguardando API da 99');
  }

  /**
   * Informações sobre como obter acesso à API
   */
  getAccessInfo() {
    return {
      platform: '99',
      status: 'API não disponível',
      requirements: [
        'Não há API pública documentada',
        'Necessário contato direto com a 99 para parcerias corporativas',
        'Processo de aprovação corporativa',
      ],
      alternatives: [
        'Sistema de entrada manual de dados (recomendado)',
        'Aguardar liberação de API pública',
        'Estabelecer parceria corporativa',
      ],
      contact: {
        website: 'https://99app.com/',
        support: 'Através do app ou site oficial',
      },
    };
  }
}

/**
 * Função auxiliar para criar cliente 99
 */
export function createNineNineClient(config?: NineNineConfig): NineNineAPIClient {
  return new NineNineAPIClient(config);
}

/**
 * Informações sobre a plataforma 99
 */
export const NINENINE_INFO = {
  name: '99',
  hasPublicAPI: false,
  requiresPartnership: true,
  documentation: 'Não disponível',
  status: 'API privada - requer parceria corporativa',
  recommendation: 'Use o sistema de entrada manual de dados do Wol\'s',
};
