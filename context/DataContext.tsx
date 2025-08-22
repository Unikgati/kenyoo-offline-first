
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, Driver, Sale, Location, Schedule, DriverType, Payment, User, LocationCategory, CompanySettings } from '../types';
import { supabase } from '../lib/supabaseClient';
import { MOCK_SETTINGS } from '../lib/mockData';
import { useAuth } from './AuthContext';

interface DataContextType {
  products: Product[];
  drivers: Driver[];
  sales: Sale[];
  locations: Location[];
  schedule: Schedule[];
  payments: Payment[];
  settings: CompanySettings | null;
  loading: boolean;
  error: any;
  // CRUD operations
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addDriver: (driverData: Omit<Driver, 'id' | 'userId'>, userCredentials: { email: string; password: string }) => Promise<void>;
  updateDriver: (driver: Driver) => Promise<void>;
  addSale: (saleData: Omit<Sale, 'id' | 'timestamp'>) => Promise<void>;
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (location: Location) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  generateSchedule: (options: { rotationInterval: number; excludedDays: number[] }) => Promise<void>;
  updateScheduleForDriverToday: (driverId: string, newLocationId: string) => Promise<void>;
  clearSchedule: () => Promise<void>;
  addPayment: (driverId: string, period: string, amount: number) => Promise<void>;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  factoryReset: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchAllData = async () => {
    console.log("DataProvider: fetchAllData started. Session user:", session?.user?.email);
    setLoading(true);
    setError(null);

    try {
        const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').limit(1).single();
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
        
        if (settingsData) {
            setSettings(settingsData as CompanySettings);
        } else {
            const { data: newSettings, error: insertError } = await supabase.from('settings').insert({ ...MOCK_SETTINGS, id: 'a8e9e3e3-1b1b-4b1b-8b1b-1b1b1b1b1b1b' }).select().single();
            if (insertError) throw insertError;
            setSettings(newSettings as CompanySettings);
        }
        
        if (session) {
            console.log("DataProvider: session exists, fetching protected data.");
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const [
                { data: productsData, error: productsError },
                { data: driversData, error: driversError },
                { data: salesData, error: salesError },
                { data: locationsData, error: locationsError },
                { data: scheduleData, error: scheduleError },
                { data: paymentsData, error: paymentsError },
            ] = await Promise.all([
                supabase.from('products').select('*').order('name', { ascending: true }),
                supabase.from('drivers').select('*').order('name', { ascending: true }),
                supabase.from('sales').select('*').gte('timestamp', oneYearAgo.toISOString()).order('timestamp', { ascending: false }),
                supabase.from('locations').select('*').order('name', { ascending: true }),
                supabase.from('schedule').select('*').order('date', { ascending: true }),
                supabase.from('payments').select('*').order('timestamp', { ascending: false }),
            ]);

            if (productsError) throw productsError;
            if (driversError) throw driversError;
            if (salesError) throw salesError;
            if (locationsError) throw locationsError;
            if (scheduleError) throw scheduleError;
            if (paymentsError) throw paymentsError;

            setProducts(productsData || []);
            setDrivers(driversData || []);
            setSales(salesData || []);
            setLocations(locationsData || []);
            setSchedule(scheduleData || []);
            setPayments(paymentsData || []);
        } else {
            console.log("DataProvider: no session, clearing protected data.");
            setProducts([]); setDrivers([]); setSales([]); setLocations([]); setSchedule([]); setPayments([]);
        }
    } catch (err: any) {
        setError(err);
        console.error("Error fetching data:", err.message || err);
        if (!settings) setSettings(MOCK_SETTINGS);
    } finally {
        console.log("DataProvider: fetchAllData finished.");
        setLoading(false);
    }
  };
  
  useEffect(() => {
    if (authLoading) {
      console.log("DataProvider: Auth is still loading, waiting.");
      return;
    }
    console.log("DataProvider: Auth has loaded, proceeding to fetch data.");
    fetchAllData();
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!session) return;

    console.log("DataProvider: Setting up real-time subscriptions.");

    const productsSubscription = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        console.log('Real-time change for products!', payload);
        if (payload.eventType === 'INSERT') setProducts(prev => [payload.new as Product, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== (payload.old as any).id));
      }).subscribe();

    const driversSubscription = supabase.channel('public:drivers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, payload => {
          console.log('Real-time change for drivers!', payload);
          if (payload.eventType === 'INSERT') setDrivers(prev => [payload.new as Driver, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
          else if (payload.eventType === 'UPDATE') setDrivers(prev => prev.map(d => d.id === payload.new.id ? payload.new as Driver : d));
          else if (payload.eventType === 'DELETE') setDrivers(prev => prev.filter(d => d.id !== (payload.old as any).id));
      }).subscribe();
      
    const salesSubscription = supabase.channel('public:sales')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, payload => {
            console.log('Real-time new sale!', payload);
            setSales(prev => [payload.new as Sale, ...prev]);
        }).subscribe();
    
    const locationsSubscription = supabase.channel('public:locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, payload => {
        console.log('Real-time change for locations!', payload);
        if (payload.eventType === 'INSERT') setLocations(prev => [payload.new as Location, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        else if (payload.eventType === 'UPDATE') setLocations(prev => prev.map(l => l.id === payload.new.id ? payload.new as Location : l));
        else if (payload.eventType === 'DELETE') setLocations(prev => prev.filter(l => l.id !== (payload.old as any).id));
      }).subscribe();

    return () => {
      console.log("DataProvider: Unsubscribing from real-time channels.");
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(driversSubscription);
      supabase.removeChannel(salesSubscription);
      supabase.removeChannel(locationsSubscription);
    };
  }, [session]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('products').insert({ ...product, id: crypto.randomUUID() });
    if (error) throw error;
  };
  const updateProduct = async (updatedProduct: Product) => {
    const { id, ...updateData } = updatedProduct;
    const { error } = await supabase.from('products').update(updateData).eq('id', id);
    if (error) throw error;
  };
  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  };

  const addDriver = async (driverData: Omit<Driver, 'id' | 'userId'>, userCredentials: { email: string, password: string }) => {
    const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email: userCredentials.email, password: userCredentials.password,
        options: { data: { name: driverData.name, role: 'driver' } }
    });
    if (signUpError) throw new Error(`Failed to create user account: ${signUpError.message}`);
    if (!newUser) throw new Error('User account creation did not return a user.');
    
    const newDriverRecord = { id: crypto.randomUUID(), ...driverData, userId: newUser.id };
    const { error: driverError } = await supabase.from('drivers').insert(newDriverRecord);
    if (driverError) {
      console.error('CRITICAL: User was created but profile creation failed. Manual cleanup for user ID:', newUser.id);
      throw new Error(`User created, but failed to create driver profile: ${driverError.message}`);
    }
  };
  const updateDriver = async (updatedDriver: Driver) => {
    const { id, name, type, contact, status, location } = updatedDriver;
    const { error } = await supabase.from('drivers').update({ name, type, contact, status, location }).eq('id', id);
    if (error) throw error;
  };
  
  const addSale = async (saleData: Omit<Sale, 'id' | 'timestamp'>) => {
      const { error } = await supabase.from('sales').insert({ ...saleData, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
      if (error) throw error;
  };

  const addLocation = async (location: Omit<Location, 'id'>) => {
    const { error } = await supabase.from('locations').insert({ ...location, id: crypto.randomUUID() });
    if (error) throw error;
  };
  const updateLocation = async (updatedLocation: Location) => {
    const { id, name, category } = updatedLocation;
    const { error } = await supabase.from('locations').update({ name, category }).eq('id', id);
    if (error) throw error;
  };
  const deleteLocation = async (locationId: string) => {
    const { error } = await supabase.from('locations').delete().eq('id', locationId);
    if (error) throw error;
  };

  const generateSchedule = async (options: { rotationInterval: number; excludedDays: number[] }) => {
    const { rotationInterval, excludedDays } = options;
    const activeDedicatedDrivers = drivers.filter(d => d.status === 'active' && d.type === DriverType.DEDICATED);
    const availableLocations = locations.filter(l => l.category === LocationCategory.DAILY_ROTATION);
    if (activeDedicatedDrivers.length === 0 || availableLocations.length === 0) {
        alert("No active dedicated drivers or schedulable locations available.");
        return;
    }

    const newScheduleItems: Omit<Schedule, 'id'>[] = [];
    const driverLocationIndices = new Map<string, number>();
    activeDedicatedDrivers.forEach((driver, index) => driverLocationIndices.set(driver.id, index));
    
    let daysScheduled = 0;
    let currentDate = new Date();
    while (daysScheduled < 30) {
        const dayOfWeek = currentDate.getDay();
        if (!excludedDays.includes(dayOfWeek)) {
            activeDedicatedDrivers.forEach(driver => {
                const driverStartIndex = driverLocationIndices.get(driver.id)!;
                const locationDayIndex = Math.floor(daysScheduled / rotationInterval);
                const locationIndex = (driverStartIndex + locationDayIndex) % availableLocations.length;
                const location = availableLocations[locationIndex];
                newScheduleItems.push({
                    driverId: driver.id, driverName: driver.name,
                    date: new Date(currentDate).toISOString().split('T')[0],
                    locationId: location.id, locationName: location.name,
                });
            });
            daysScheduled++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    await supabase.from('schedule').delete().in('driverId', activeDedicatedDrivers.map(d => d.id));
    await supabase.from('schedule').insert(newScheduleItems);
    const { data: scheduleData, error } = await supabase.from('schedule').select('*').order('date', { ascending: true });
    if (error) throw error;
    setSchedule(scheduleData || []);
  };
  
  const updateScheduleForDriverToday = async (driverId: string, newLocationId: string) => {
    const todayISO = new Date().toISOString().split('T')[0];
    const newLocation = locations.find(l => l.id === newLocationId);
    if (!newLocation) return;
    
    const { data, error } = await supabase.from('schedule')
        .update({ locationId: newLocation.id, locationName: newLocation.name })
        .eq('driverId', driverId).eq('date', todayISO).select().single();
    if (error) throw error;
    if (data) setSchedule(prev => prev.map(item => (item.driverId === driverId && item.date === todayISO) ? data : item));
  };

  const clearSchedule = async () => {
    await supabase.from('schedule').delete().neq('id', '0');
    setSchedule([]);
  };

  const addPayment = async (driverId: string, period: string, amount: number) => {
    const { data, error } = await supabase.from('payments').insert({ id: crypto.randomUUID(), driverId, period, amount, timestamp: new Date().toISOString() }).select().single();
    if (error) throw error;
    if (data) setPayments(prev => [data, ...prev]);
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    if (!settings) return;
    const { id, ...updateData } = newSettings;
    const { data, error } = await supabase.from('settings').update(updateData).eq('id', settings.id).select().single();
    if (error) throw error;
    if (data) setSettings(data as CompanySettings);
  };

  const factoryReset = async () => {
    console.warn("Factory Reset must be performed in the Supabase dashboard.");
  };

  return (
    <DataContext.Provider value={{ 
        products, drivers, sales, locations, schedule, payments, settings,
        loading, error,
        addProduct, updateProduct, deleteProduct, 
        addDriver, updateDriver, 
        addSale, 
        addLocation, updateLocation, deleteLocation,
        generateSchedule, updateScheduleForDriverToday, clearSchedule,
        addPayment,
        updateSettings,
        factoryReset
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
