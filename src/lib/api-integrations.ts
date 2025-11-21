/**
 * API INTEGRATIONS - Sistema Completo de Integração com Plataformas
 * 
 * Este arquivo fornece uma interface unificada para todas as integrações
 * com plataformas de transporte (Uber, 99, InDriver).
 * 
 * FUNCIONALIDADES:
 * ✅ Integração completa com Uber API (OAuth + Sync)
 * ✅ Estrutura preparada para 99 e InDriver
 * ✅ Sistema de entrada manual de dados
 * ✅ Sincronização automática de corridas
 * ✅ Gerenciamento de tokens OAuth
 * 
 * DOCUMENTAÇÃO COMPLETA: Ver API_INTEGRATION_GUIDE.md
 */

export * from './platform-integrations';
export * from './platform-integrations/uber-api';
export * from './platform-integrations/99-api';
export * from './platform-integrations/indriver-api';

import { 
  createPlatformManager, 
  checkAPIsAvailability,
  type Platform,
  type PlatformStatus,
  type SyncResult 
} from './platform-integrations';

/**
 * GUIA RÁPIDO DE USO
 * 
 * 1. CONECTAR UBER:
 * ```typescript
 * const manager = createPlatformManager(userId);
 * const authUrl = await manager.connectPlatform('uber');
 * window.location.href = authUrl; // Redireciona para OAuth
 * ```
 * 
 * 2. SINCRONIZAR CORRIDAS:
 * ```typescript
 * const manager = createPlatformManager(userId);
 * await manager.initializeUber();
 * const result = await manager.syncPlatform('uber');
 * console.log(`${result.ridesCount} corridas sincronizadas!`);
 * ```
 * 
 * 3. VERIFICAR STATUS:
 * ```typescript
 * const manager = createPlatformManager(userId);
 * const statuses = await manager.getPlatformsStatus();
 * console.log(statuses);
 * ```
 * 
 * 4. ENTRADA MANUAL (99 e InDriver):
 * ```typescript
 * import { supabase } from './supabase';
 * 
 * await supabase.from('rides').insert({
 *   user_id: userId,
 *   platform: '99',
 *   value: 25.50,
 *   distance: 8.5,
 *   duration: 20,
 *   total_earnings: 25.50
 * });
 * ```
 */

/**
 * Verificar disponibilidade de todas as APIs
 */
export function checkPlatformAPIs() {
  return checkAPIsAvailability();
}

/**
 * Criar gerenciador de plataformas
 */
export function createIntegrationManager(userId: string) {
  return createPlatformManager(userId);
}

/**
 * Informações sobre cada plataforma
 */
export const PLATFORMS_INFO = {
  uber: {
    name: 'Uber',
    hasAPI: true,
    apiType: 'OAuth 2.0',
    documentation: 'https://developer.uber.com/',
    status: 'Disponível',
    features: [
      'Sincronização automática de corridas',
      'Histórico completo',
      'Detalhes de cada corrida',
      'Perfil do motorista',
    ],
    setup: 'Ver API_INTEGRATION_GUIDE.md',
  },
  '99': {
    name: '99',
    hasAPI: false,
    apiType: 'Privada',
    documentation: 'Não disponível',
    status: 'Requer parceria corporativa',
    features: [
      'Entrada manual de dados',
      'Armazenamento local',
      'Relatórios e análises',
    ],
    setup: 'Use o sistema de entrada manual',
  },
  indriver: {
    name: 'InDriver',
    hasAPI: false,
    apiType: 'Privada',
    documentation: 'Não disponível',
    status: 'Requer parceria corporativa',
    features: [
      'Entrada manual de dados',
      'Armazenamento local',
      'Relatórios e análises',
    ],
    setup: 'Use o sistema de entrada manual',
  },
};

/**
 * Configuração de variáveis de ambiente necessárias
 */
export const REQUIRED_ENV_VARS = {
  uber: [
    'NEXT_PUBLIC_UBER_CLIENT_ID',
    'UBER_CLIENT_SECRET',
    'NEXT_PUBLIC_UBER_REDIRECT_URI',
  ],
  '99': [],
  indriver: [],
  encryption: [
    'TOKEN_ENCRYPTION_KEY', // Para criptografar tokens OAuth
  ],
};

/**
 * Validar configuração de ambiente
 */
export function validateEnvironmentConfig(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Verificar Uber
  if (process.env.NEXT_PUBLIC_UBER_CLIENT_ID) {
    if (!process.env.UBER_CLIENT_SECRET) {
      missing.push('UBER_CLIENT_SECRET');
    }
    if (!process.env.NEXT_PUBLIC_UBER_REDIRECT_URI) {
      missing.push('NEXT_PUBLIC_UBER_REDIRECT_URI');
    }
  } else {
    warnings.push('Uber API não configurada - sincronização automática desabilitada');
  }

  // Verificar chave de criptografia
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    warnings.push('TOKEN_ENCRYPTION_KEY não configurada - tokens não serão criptografados');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Tipos exportados para uso em outros arquivos
 */
export type { Platform, PlatformStatus, SyncResult };
