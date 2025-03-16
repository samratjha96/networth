import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Account } from "@/components/AccountsList";
import { DatabaseProvider, NetworthHistory } from "@/lib/types";

// Supabase implementation of the DatabaseProvider interface
export class SupabaseDatabase implements DatabaseProvider {
  private static instance: SupabaseDatabase | null = null;
  private supabase: SupabaseClient;
  private userId: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Initialize Supabase client with env variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key must be provided in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  static getInstance(): SupabaseDatabase {
    if (!SupabaseDatabase.instance) {
      SupabaseDatabase.instance = new SupabaseDatabase();
    }
    return SupabaseDatabase.instance;
  }

  // Set the current user ID - call this after user authentication
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Get the current user ID or throw if not set
  private getUserId(): string {
    if (!this.userId) {
      throw new Error('User not authenticated. Call setUserId after authentication.');
    }
    return this.userId;
  }

  // Initialize the database structure
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if tables exist and create them if needed
    // This would typically be done via Supabase migrations, but we include it here for completeness
    
    // The actual table creation would be done in the Supabase dashboard or via migrations,
    // but we're ensuring the client is initialized properly
    
    console.log('Supabase database client initialized');
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    // No explicit close needed for Supabase client
    console.log('Supabase database connection closed');
  }

  // Account operations
  async getAllAccounts(): Promise<Account[]> {
    const userId = this.getUserId();
    
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
    
    return data || [];
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const userId = this.getUserId();
    
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Record not found error code
        return undefined;
      }
      console.error('Error fetching account:', error);
      throw error;
    }
    
    return data;
  }

  async insertAccount(accountData: Omit<Account, "id">): Promise<Account> {
    const userId = this.getUserId();
    
    // Ensure balance is formatted properly for debt accounts
    const balance = accountData.isDebt
      ? -Math.abs(accountData.balance)
      : Math.abs(accountData.balance);
    
    const newAccount = {
      ...accountData,
      balance,
      user_id: userId,
    };
    
    const { data, error } = await this.supabase
      .from('accounts')
      .insert(newAccount)
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting account:', error);
      throw error;
    }
    
    // Remove user_id from returned data to maintain interface compatibility
    const { user_id, ...accountResponse } = data;
    
    await this.updateNetworthSnapshot();
    return accountResponse as Account;
  }

  async updateAccount(account: Account): Promise<void> {
    const userId = this.getUserId();
    
    // Ensure balance is formatted properly for debt accounts
    const balance = account.isDebt
      ? -Math.abs(account.balance)
      : Math.abs(account.balance);
    
    const { error } = await this.supabase
      .from('accounts')
      .update({ ...account, balance })
      .eq('id', account.id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error updating account:', error);
      throw error;
    }
    
    await this.updateNetworthSnapshot();
  }

  async deleteAccount(id: string): Promise<void> {
    const userId = this.getUserId();
    
    const { error } = await this.supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
    
    await this.updateNetworthSnapshot();
  }

  // Networth history operations
  async getNetworthHistory(days: number): Promise<NetworthHistory[]> {
    const userId = this.getUserId();
    
    let query = this.supabase
      .from('networth_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    
    // Filter by days if specified
    if (days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      query = query.gte('date', startDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching networth history:', error);
      throw error;
    }
    
    // Transform data to match the expected format, removing user_id
    return data.map(item => ({
      date: item.date,
      value: item.value
    }));
  }

  async addNetworthSnapshot(value: number): Promise<void> {
    const userId = this.getUserId();
    const now = new Date().toISOString();
    
    // Check if we have an entry from the last hour to avoid too many data points
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    
    const { data: recentEntries, error: fetchError } = await this.supabase
      .from('networth_history')
      .select('id')
      .eq('user_id', userId)
      .gte('date', lastHour.toISOString());
    
    if (fetchError) {
      console.error('Error checking recent history:', fetchError);
      throw fetchError;
    }
    
    if (recentEntries && recentEntries.length > 0) {
      // Update the most recent entry instead of creating a new one
      const { error } = await this.supabase
        .from('networth_history')
        .update({ date: now, value })
        .eq('id', recentEntries[0].id)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating networth history:', error);
        throw error;
      }
    } else {
      // Add a new entry
      const { error } = await this.supabase
        .from('networth_history')
        .insert({
          user_id: userId,
          date: now,
          value
        });
        
      if (error) {
        console.error('Error adding networth history:', error);
        throw error;
      }
    }
    
    // Optionally implement history size limit by deleting oldest entries
    // This would depend on your retention policy
  }

  private async updateNetworthSnapshot(): Promise<void> {
    const totalNetworth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(totalNetworth);
  }

  // Helper to calculate current net worth
  async calculateCurrentNetworth(): Promise<number> {
    const accounts = await this.getAllAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  async synchronizeNetworthHistory(): Promise<void> {
    const currentNetworth = await this.calculateCurrentNetworth();
    await this.addNetworthSnapshot(currentNetworth);
  }

  // Test mode methods are not implemented for Supabase
  // as they don't make sense in a production environment
  isTestModeEnabled(): boolean {
    return false;
  }
  
  setTestMode(): void {
    console.warn('Test mode is not available in Supabase implementation');
  }
}

// Export initialized instance
export const supabaseDb = SupabaseDatabase.getInstance(); 