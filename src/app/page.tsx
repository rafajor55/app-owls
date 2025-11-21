'use client';

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Clock, DollarSign, Plus, Menu, LogOut, Settings, MessageSquare, Trophy, FileText, Send, Download, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { User, Ride, DailySummary, Platform } from '@/lib/types';
import { exportRidesToCSV, exportDailySummaryToCSV, exportCompleteReport } from '@/lib/export-spreadsheet';
import { createPlatformManager } from '@/lib/platform-integrations';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineStartTime, setOnlineStartTime] = useState<Date | null>(null);
  const [timeOnline, setTimeOnline] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados para integrações
  const [isUberConnected, setIsUberConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Estados para adicionar corrida
  const [showAddRide, setShowAddRide] = useState(false);
  const [newRide, setNewRide] = useState({
    platform: 'uber' as Platform,
    value: '',
    distance: '',
    duration: '',
    category: '',
    bonus: '',
    multiplier: ''
  });

  // Estados para despesas
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenses, setExpenses] = useState({
    fuel: '',
    food: '',
    toll: '',
    other: ''
  });

  // Dados mockados para demonstração
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    date: new Date(),
    totalEarnings: 0,
    totalExpenses: 0,
    netProfit: 0,
    timeOnline: 0,
    totalRides: 0,
    earningsByPlatform: {
      uber: 0,
      '99': 0,
      indriver: 0
    },
    totalBonus: 0
  });

  const [rides, setRides] = useState<Ride[]>([]);

  // Timer para tempo online
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnline && onlineStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - onlineStartTime.getTime()) / 1000 / 60);
        setTimeOnline(diff);
      }, 60000); // Atualiza a cada minuto
    }
    return () => clearInterval(interval);
  }, [isOnline, onlineStartTime]);

  // Aplicar tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    // Mock de autenticação
    const mockUser: User = {
      id: '1',
      name: 'Motorista Teste',
      email: email,
      phone: '11999999999',
      city: 'São Paulo',
      isAdmin: email === 'fael.souza.pereira@gmail.com',
      isBlocked: false,
      createdAt: new Date()
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const mockUser: User = {
      id: '1',
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      city: formData.get('city') as string,
      instagram: formData.get('instagram') as string || undefined,
      isAdmin: (formData.get('email') as string) === 'fael.souza.pereira@gmail.com',
      isBlocked: false,
      createdAt: new Date()
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const toggleOnline = () => {
    if (!isOnline) {
      setOnlineStartTime(new Date());
      setIsOnline(true);
    } else {
      setIsOnline(false);
      setOnlineStartTime(null);
    }
  };

  const handleAddRide = () => {
    const ride: Ride = {
      id: Date.now().toString(),
      userId: user?.id || '1',
      platform: newRide.platform,
      date: new Date(),
      value: parseFloat(newRide.value) || 0,
      distance: parseFloat(newRide.distance) || 0,
      duration: parseFloat(newRide.duration) || 0,
      category: newRide.category,
      bonus: parseFloat(newRide.bonus) || 0,
      multiplier: parseFloat(newRide.multiplier) || 1,
      totalEarnings: 0
    };

    // Calcular total com multiplicador ou bônus
    if (newRide.platform === '99' || newRide.platform === 'indriver') {
      ride.totalEarnings = ride.value * (ride.multiplier || 1) + ride.bonus;
    } else {
      ride.totalEarnings = ride.value + ride.bonus;
    }

    setRides([...rides, ride]);
    
    // Atualizar resumo
    setDailySummary(prev => ({
      ...prev,
      totalRides: prev.totalRides + 1,
      totalEarnings: prev.totalEarnings + ride.totalEarnings,
      totalBonus: prev.totalBonus + ride.bonus,
      earningsByPlatform: {
        ...prev.earningsByPlatform,
        [ride.platform]: prev.earningsByPlatform[ride.platform] + ride.totalEarnings
      },
      netProfit: prev.totalEarnings + ride.totalEarnings - prev.totalExpenses
    }));

    setShowAddRide(false);
    setNewRide({
      platform: 'uber',
      value: '',
      distance: '',
      duration: '',
      category: '',
      bonus: '',
      multiplier: ''
    });
  };

  const handleAddExpense = () => {
    const totalExpense = 
      (parseFloat(expenses.fuel) || 0) +
      (parseFloat(expenses.food) || 0) +
      (parseFloat(expenses.toll) || 0) +
      (parseFloat(expenses.other) || 0);

    setDailySummary(prev => ({
      ...prev,
      totalExpenses: totalExpense,
      netProfit: prev.totalEarnings - totalExpense
    }));

    setShowAddExpense(false);
  };

  // Conectar com Uber
  const handleConnectUber = async () => {
    if (!user) return;

    try {
      const manager = createPlatformManager(user.id);
      const authUrl = await manager.connectPlatform('uber');
      
      if (authUrl) {
        // Em produção, redirecionar para OAuth
        // window.location.href = authUrl;
        
        // Para demonstração, simular conexão
        setIsUberConnected(true);
        setSyncMessage('✅ Uber conectado com sucesso!');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      setSyncMessage('❌ Erro ao conectar Uber. Verifique as configurações.');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // Sincronizar corridas da Uber
  const handleSyncUber = async () => {
    if (!user || !isUberConnected) return;

    setIsSyncing(true);
    setSyncMessage('🔄 Sincronizando corridas da Uber...');

    try {
      const manager = createPlatformManager(user.id);
      await manager.initializeUber();
      
      const result = await manager.syncPlatform('uber');
      
      if (result.success) {
        setSyncMessage(`✅ ${result.ridesCount} corridas sincronizadas!`);
        
        // Atualizar interface (em produção, recarregar do banco)
        // Por enquanto, apenas mostrar mensagem de sucesso
      } else {
        setSyncMessage('❌ Erro na sincronização. Tente novamente.');
      }
    } catch (error) {
      setSyncMessage('❌ Erro ao sincronizar. Verifique sua conexão.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  // Exportar para planilha
  const handleExportCSV = () => {
    if (rides.length === 0) {
      alert('Nenhuma corrida para exportar!');
      return;
    }
    exportRidesToCSV(rides);
  };

  const handleExportSummary = () => {
    exportDailySummaryToCSV(dailySummary);
  };

  const handleExportComplete = () => {
    if (rides.length === 0) {
      alert('Nenhuma corrida para exportar!');
      return;
    }
    exportCompleteReport(dailySummary, rides);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/6d3d77ec-5947-480e-a0a4-03a0906ff69c.jpg" 
                alt="Wol's Logo" 
                className="h-32 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-4xl font-black tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif', letterSpacing: '0.1em' }}>WOL'S</CardTitle>
            <CardDescription>Controle Financeiro para Motoristas</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={showLogin ? 'login' : 'register'} onValueChange={(v) => setShowLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full">Entrar</Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input id="name" name="name" placeholder="Seu nome" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">E-mail *</Label>
                    <Input id="reg-email" name="email" type="email" placeholder="seu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input id="city" name="city" placeholder="São Paulo" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram (opcional)</Label>
                    <Input id="instagram" name="instagram" placeholder="@seuperfil" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha *</Label>
                    <Input id="reg-password" name="password" type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full">Cadastrar</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/6d3d77ec-5947-480e-a0a4-03a0906ff69c.jpg" 
                alt="Wol's Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold">Wol's</h1>
                <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="theme-toggle" className="text-sm">Modo Noturno</Label>
                <Switch
                  id="theme-toggle"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Button
                variant={isOnline ? "destructive" : "default"}
                onClick={toggleOnline}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                {isOnline ? 'Ficar Offline' : 'Ficar Online'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Online */}
      {isOnline && (
        <div className="bg-green-500 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-semibold">Você está ONLINE - Tempo: {formatTime(timeOnline)}</span>
          </div>
        </div>
      )}

      {/* Mensagem de Sincronização */}
      {syncMessage && (
        <div className="bg-blue-500 text-white py-2 px-4 text-center">
          <span className="font-semibold">{syncMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-2">
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 flex-col sm:flex-row py-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="rides" className="gap-1 sm:gap-2 flex-col sm:flex-row py-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Corridas</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-1 sm:gap-2 flex-col sm:flex-row py-2">
              <Trophy className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Ranking</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 sm:gap-2 flex-col sm:flex-row py-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 flex-col sm:flex-row py-2 col-span-3 sm:col-span-1">
              <Settings className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Configurações</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Ganhos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(dailySummary.totalEarnings)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{dailySummary.totalRides} corridas hoje</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(dailySummary.totalExpenses)}</div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs mt-1"
                    onClick={() => setShowAddExpense(true)}
                  >
                    Adicionar despesa
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dailySummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dailySummary.netProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ganhos - Despesas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Online</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(timeOnline)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Hoje</p>
                </CardContent>
              </Card>
            </div>

            {/* Ganhos por Plataforma */}
            <Card>
              <CardHeader>
                <CardTitle>Ganhos por Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Uber</Badge>
                    {isUberConnected && <Badge variant="outline" className="text-green-600">Conectado</Badge>}
                  </div>
                  <span className="font-semibold">{formatCurrency(dailySummary.earningsByPlatform.uber)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">99</Badge>
                  </div>
                  <span className="font-semibold">{formatCurrency(dailySummary.earningsByPlatform['99'])}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">InDriver</Badge>
                  </div>
                  <span className="font-semibold">{formatCurrency(dailySummary.earningsByPlatform.indriver)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => setShowAddRide(true)} 
                className="gap-2"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Adicionar Corrida Manual
              </Button>

              <Button 
                onClick={handleExportComplete}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <Download className="w-5 h-5" />
                Exportar Planilha Completa
              </Button>
            </div>
          </TabsContent>

          {/* Corridas */}
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Corridas</CardTitle>
                    <CardDescription>Todas as corridas registradas hoje</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rides.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma corrida registrada ainda</p>
                    <Button 
                      onClick={() => setShowAddRide(true)} 
                      className="mt-4"
                      variant="outline"
                    >
                      Adicionar primeira corrida
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {rides.map((ride) => (
                        <Card key={ride.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <Badge>{ride.platform.toUpperCase()}</Badge>
                              <span className="font-semibold text-lg">{formatCurrency(ride.totalEarnings)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div>Distância: {ride.distance} km</div>
                              <div>Duração: {ride.duration} min</div>
                              <div>Categoria: {ride.category}</div>
                              <div>Bônus: {formatCurrency(ride.bonus)}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle>Ranking do Dia - {user?.city}</CardTitle>
                <CardDescription>Top 10 motoristas com maiores ganhos hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ranking em desenvolvimento</p>
                  <p className="text-sm mt-2">Em breve você poderá ver os melhores motoristas da sua cidade!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Sala de Bate-Papo</CardTitle>
                <CardDescription>Converse com outros motoristas da sua região</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chat em desenvolvimento</p>
                  <p className="text-sm mt-2">Em breve você poderá conversar com outros motoristas!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Informações do Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>Gerencie suas preferências e perfil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-mail:</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cidade:</span>
                      <span className="font-medium">{user?.city}</span>
                    </div>
                    {user?.isAdmin && (
                      <Badge variant="destructive" className="w-fit">Administrador</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Integrações */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrações com Plataformas</CardTitle>
                  <CardDescription>Conecte suas contas para sincronização automática</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Uber */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold">
                          U
                        </div>
                        <div>
                          <h4 className="font-semibold">Uber</h4>
                          <p className="text-sm text-muted-foreground">
                            {isUberConnected ? 'Conectado' : 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      {isUberConnected ? (
                        <Badge variant="outline" className="text-green-600">✓ Conectado</Badge>
                      ) : (
                        <Button onClick={handleConnectUber} size="sm" className="gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Conectar
                        </Button>
                      )}
                    </div>
                    {isUberConnected && (
                      <Button 
                        onClick={handleSyncUber} 
                        disabled={isSyncing}
                        variant="outline" 
                        className="w-full gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Corridas'}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* 99 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
                          99
                        </div>
                        <div>
                          <h4 className="font-semibold">99</h4>
                          <p className="text-sm text-muted-foreground">API não disponível</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Manual</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A 99 não possui API pública. Use o sistema de entrada manual de corridas.
                    </p>
                  </div>

                  <Separator />

                  {/* InDriver */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                          ID
                        </div>
                        <div>
                          <h4 className="font-semibold">InDriver</h4>
                          <p className="text-sm text-muted-foreground">API não disponível</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Manual</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A InDriver não possui API pública. Use o sistema de entrada manual de corridas.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea placeholder="Compartilhe suas sugestões para melhorar o app..." />
                  <Button className="w-full gap-2">
                    <Send className="w-4 h-4" />
                    Enviar Feedback
                  </Button>
                </CardContent>
              </Card>

              {/* Sair */}
              <Button 
                variant="destructive" 
                className="w-full gap-2"
                onClick={() => {
                  setIsAuthenticated(false);
                  setUser(null);
                }}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog Adicionar Corrida */}
      <Dialog open={showAddRide} onOpenChange={setShowAddRide}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Corrida</DialogTitle>
            <DialogDescription>Registre uma nova corrida no sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={newRide.platform} onValueChange={(v) => setNewRide({...newRide, platform: v as Platform})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uber">Uber</SelectItem>
                  <SelectItem value="99">99</SelectItem>
                  <SelectItem value="indriver">InDriver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor da Corrida (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="25.00"
                value={newRide.value}
                onChange={(e) => setNewRide({...newRide, value: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distância (km)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="10.5"
                  value={newRide.distance}
                  onChange={(e) => setNewRide({...newRide, distance: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input 
                  type="number"
                  placeholder="25"
                  value={newRide.duration}
                  onChange={(e) => setNewRide({...newRide, duration: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input 
                placeholder="UberX, POP, Comfort..."
                value={newRide.category}
                onChange={(e) => setNewRide({...newRide, category: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Bônus (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={newRide.bonus}
                onChange={(e) => setNewRide({...newRide, bonus: e.target.value})}
              />
            </div>

            {(newRide.platform === '99' || newRide.platform === 'indriver') && (
              <div className="space-y-2">
                <Label>Multiplicador</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="1.0"
                  value={newRide.multiplier}
                  onChange={(e) => setNewRide({...newRide, multiplier: e.target.value})}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddRide(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleAddRide}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Despesa */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Despesas</DialogTitle>
            <DialogDescription>Registre suas despesas do dia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Combustível (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={expenses.fuel}
                onChange={(e) => setExpenses({...expenses, fuel: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Alimentação (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={expenses.food}
                onChange={(e) => setExpenses({...expenses, food: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Pedágio (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={expenses.toll}
                onChange={(e) => setExpenses({...expenses, toll: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Outros (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={expenses.other}
                onChange={(e) => setExpenses({...expenses, other: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddExpense(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleAddExpense}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
