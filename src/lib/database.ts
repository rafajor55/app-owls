import { supabase } from './supabase';
import type { Database } from './supabase';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type Ride = Database['public']['Tables']['rides']['Row'];
type RideInsert = Database['public']['Tables']['rides']['Insert'];
type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type OnlineSession = Database['public']['Tables']['online_sessions']['Row'];
type OnlineSessionInsert = Database['public']['Tables']['online_sessions']['Insert'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// ==================== USUÁRIOS ====================

export async function createUser(user: UserInsert) {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<UserInsert>) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== CORRIDAS ====================

export async function createRide(ride: RideInsert) {
  const { data, error } = await supabase
    .from('rides')
    .insert(ride)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRidesByUser(userId: string, startDate?: Date, endDate?: Date) {
  let query = supabase
    .from('rides')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('date', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getRidesToday(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getRidesByUser(userId, today, tomorrow);
}

export async function getDailySummary(userId: string, date: Date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Buscar corridas do dia
  const rides = await getRidesByUser(userId, startOfDay, endOfDay);

  // Buscar despesas do dia
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date.toISOString().split('T')[0])
    .single();

  // Calcular totais
  const totalEarnings = rides.reduce((sum, ride) => sum + ride.total_earnings, 0);
  const totalExpenses = expensesData?.total || 0;
  const totalBonus = rides.reduce((sum, ride) => sum + ride.bonus, 0);

  // Calcular por plataforma
  const earningsByPlatform = {
    uber: rides.filter(r => r.platform === 'uber').reduce((sum, r) => sum + r.total_earnings, 0),
    '99': rides.filter(r => r.platform === '99').reduce((sum, r) => sum + r.total_earnings, 0),
    indriver: rides.filter(r => r.platform === 'indriver').reduce((sum, r) => sum + r.total_earnings, 0),
  };

  return {
    date,
    totalEarnings,
    totalExpenses,
    netProfit: totalEarnings - totalExpenses,
    totalRides: rides.length,
    earningsByPlatform,
    totalBonus,
  };
}

// ==================== DESPESAS ====================

export async function createOrUpdateExpense(expense: ExpenseInsert) {
  const { data: existing } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', expense.user_id)
    .eq('date', expense.date || new Date().toISOString().split('T')[0])
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getExpensesByUser(userId: string, startDate?: Date, endDate?: Date) {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate.toISOString().split('T')[0]);
  }
  if (endDate) {
    query = query.lte('date', endDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// ==================== SESSÕES ONLINE ====================

export async function startOnlineSession(userId: string) {
  const { data, error } = await supabase
    .from('online_sessions')
    .insert({
      user_id: userId,
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endOnlineSession(sessionId: string) {
  const { data: session } = await supabase
    .from('online_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Sessão não encontrada');

  const endTime = new Date();
  const startTime = new Date(session.start_time);
  const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

  const { data, error } = await supabase
    .from('online_sessions')
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveSession(userId: string) {
  const { data, error } = await supabase
    .from('online_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ==================== CHAT ====================

export async function sendChatMessage(message: ChatMessageInsert) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChatMessages(city: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      users (
        name,
        instagram
      )
    `)
    .eq('city', city)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function subscribeToChatMessages(city: string, callback: (message: ChatMessage) => void) {
  return supabase
    .channel(`chat:${city}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `city=eq.${city}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();
}

// ==================== RANKING ====================

export async function getDailyRanking(city: string, date: Date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('rides')
    .select(`
      user_id,
      total_earnings,
      users!inner (
        name,
        city,
        instagram
      )
    `)
    .eq('users.city', city)
    .gte('date', startOfDay.toISOString())
    .lte('date', endOfDay.toISOString());

  if (error) throw error;

  // Agrupar por usuário e somar ganhos
  const userEarnings = data.reduce((acc: any, ride: any) => {
    const userId = ride.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        name: ride.users.name,
        instagram: ride.users.instagram,
        totalEarnings: 0,
        ridesCount: 0,
      };
    }
    acc[userId].totalEarnings += ride.total_earnings;
    acc[userId].ridesCount += 1;
    return acc;
  }, {});

  // Converter para array e ordenar
  return Object.values(userEarnings)
    .sort((a: any, b: any) => b.totalEarnings - a.totalEarnings)
    .slice(0, 10);
}
