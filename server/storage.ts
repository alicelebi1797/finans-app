import { db } from "./db";
import {
  users, fixedExpenses, variableExpenses, creditCardExpenses, loans,
  fixedIncomes, variableIncomes, expectedIncomes, wallets, ibans, walletCards, savings, extraSavings, savingsTransactions,
  type User, type FixedExpense, type VariableExpense, type CreditCardExpense,
  type Loan, type FixedIncome, type VariableIncome, type ExpectedIncome, type Wallet,
  type Iban, type WalletCard, type Savings, type ExtraSavings
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  seedUser(username: string, password: string): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(username: string, password: string): Promise<User>;
  listAllUsers(): Promise<User[]>;
  adminUpdateUser(id: number, data: { username?: string; password?: string; displayName?: string }): Promise<User>;
  adminDeleteUser(id: number): Promise<void>;
  updateUserBudget(userId: number, budget: number): Promise<void>;
  payLoanInstallment(id: number): Promise<Loan>;
  monthlyReset(userId: number): Promise<void>;
  getPlanningData(userId: number): Promise<Record<string, any>>;
  updatePlanningData(userId: number, data: Record<string, any>): Promise<void>;

  getFixedExpenses(userId: number): Promise<FixedExpense[]>;
  createFixedExpense(userId: number, data: any): Promise<FixedExpense>;
  updateFixedExpense(id: number, data: any): Promise<FixedExpense>;
  deleteFixedExpense(id: number): Promise<void>;

  getVariableExpenses(userId: number): Promise<VariableExpense[]>;
  createVariableExpense(userId: number, data: any): Promise<VariableExpense>;
  updateVariableExpense(id: number, data: any): Promise<VariableExpense>;
  deleteVariableExpense(id: number): Promise<void>;

  getCreditCards(userId: number): Promise<CreditCardExpense[]>;
  createCreditCard(userId: number, data: any): Promise<CreditCardExpense>;
  updateCreditCard(id: number, data: any): Promise<CreditCardExpense>;
  deleteCreditCard(id: number): Promise<void>;

  getLoans(userId: number): Promise<Loan[]>;
  createLoan(userId: number, data: any): Promise<Loan>;
  updateLoan(id: number, data: any): Promise<Loan>;
  deleteLoan(id: number): Promise<void>;

  getFixedIncomes(userId: number): Promise<FixedIncome[]>;
  createFixedIncome(userId: number, data: any): Promise<FixedIncome>;
  updateFixedIncome(id: number, data: any): Promise<FixedIncome>;
  deleteFixedIncome(id: number): Promise<void>;

  getVariableIncomes(userId: number): Promise<VariableIncome[]>;
  createVariableIncome(userId: number, data: any): Promise<VariableIncome>;
  updateVariableIncome(id: number, data: any): Promise<VariableIncome>;
  deleteVariableIncome(id: number): Promise<void>;
  partialReceiveFixedIncome(id: number, receivedAmount: number): Promise<FixedIncome>;
  partialReceiveVariableIncome(id: number, receivedAmount: number): Promise<VariableIncome>;

  getExpectedIncomes(userId: number): Promise<ExpectedIncome[]>;
  createExpectedIncome(userId: number, data: any): Promise<ExpectedIncome>;
  approveExpectedIncome(id: number): Promise<ExpectedIncome>;
  deleteExpectedIncome(id: number): Promise<void>;

  getWallets(userId: number): Promise<Wallet[]>;
  updateWallet(id: number, data: any): Promise<Wallet>;

  getIbans(userId: number): Promise<Iban[]>;
  createIban(userId: number, data: any): Promise<Iban>;
  updateIban(id: number, data: any): Promise<Iban>;
  deleteIban(id: number): Promise<void>;

  getWalletCards(userId: number): Promise<WalletCard[]>;
  createWalletCard(userId: number, data: any): Promise<WalletCard>;
  updateWalletCard(id: number, data: any): Promise<WalletCard>;
  deleteWalletCard(id: number): Promise<void>;

  getSavings(userId: number): Promise<Savings[]>;
  upsertSavings(userId: number, currency: string, amount: number): Promise<Savings>;

  getExtraSavings(userId: number): Promise<ExtraSavings[]>;
  upsertExtraSavings(userId: number, title: string, currency: string, amount: number): Promise<ExtraSavings>;
  addExtraSavingsAmount(id: number, addAmount: number): Promise<ExtraSavings>;
  updateExtraSavingsInfo(id: number, title: string, currency: string): Promise<ExtraSavings>;
}

export class DatabaseStorage implements IStorage {
  async seedUser(username: string, password: string): Promise<User> {
    const existing = await this.getUserByUsername(username);
    if (existing) {
      const matches = await bcrypt.compare(password, existing.password);
      if (!matches) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [user] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, existing.id)).returning();
        console.log(`[seed] Kullanıcı şifresi güncellendi: ${username}`);
        return user;
      }
      return existing;
    }
    console.log(`[seed] Yeni kullanıcı oluşturuldu: ${username}`);
    return this.createUser(username, password);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({ username, password: hashedPassword }).returning();
    return user;
  }

  async listAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.id);
  }

  async adminUpdateUser(id: number, data: { username?: string; password?: string; displayName?: string }): Promise<User> {
    const update: Record<string, any> = {};
    if (data.username !== undefined) update.username = data.username;
    if (data.displayName !== undefined) update.displayName = data.displayName;
    if (data.password !== undefined) update.password = await bcrypt.hash(data.password, 10);
    const [user] = await db.update(users).set(update).where(eq(users.id, id)).returning();
    return user;
  }

  async adminDeleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async payLoanInstallment(id: number): Promise<Loan> {
    const [current] = await db.select().from(loans).where(eq(loans.id, id));
    if (!current) throw new Error("Kredi bulunamadı");
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (current.lastPaidAt === currentMonth) {
      const [l] = await db.update(loans).set({ isPaid: true }).where(eq(loans.id, id)).returning();
      return l;
    }
    const newRemaining = Math.max(0, (current.remainingInstallments ?? 1) - 1);
    const [l] = await db.update(loans)
      .set({ isPaid: true, remainingInstallments: newRemaining, lastPaidAt: currentMonth })
      .where(eq(loans.id, id))
      .returning();
    return l;
  }

  async monthlyReset(userId: number): Promise<void> {
    await db.update(fixedIncomes).set({ isReceived: false, receivedAmount: 0 }).where(eq(fixedIncomes.userId, userId));
    await db.update(fixedExpenses).set({ isPaid: false }).where(eq(fixedExpenses.userId, userId));
    await db.update(creditCardExpenses).set({ isPaid: false, amount: 0, paidAmount: 0 }).where(eq(creditCardExpenses.userId, userId));
    await db.update(loans).set({ isPaid: false }).where(eq(loans.userId, userId));
    await db.delete(variableIncomes).where(eq(variableIncomes.userId, userId));
    await db.delete(variableExpenses).where(eq(variableExpenses.userId, userId));
    await db.delete(expectedIncomes).where(eq(expectedIncomes.userId, userId));
    await db.delete(savingsTransactions).where(eq(savingsTransactions.userId, userId));
    await db.update(users).set({ cashAdjustment: 0 }).where(eq(users.id, userId));
  }

  async getPlanningData(userId: number): Promise<Record<string, any>> {
    const user = await this.getUserById(userId);
    if (!user) return {};
    try { return JSON.parse((user as any).planningData || '{}'); } catch { return {}; }
  }

  async updatePlanningData(userId: number, data: Record<string, any>): Promise<void> {
    await db.update(users).set({ planningData: JSON.stringify(data) } as any).where(eq(users.id, userId));
  }

  async updateUserBudget(userId: number, budget: number): Promise<void> {
    await db.update(users).set({ monthlyBudget: budget }).where(eq(users.id, userId));
  }

  async updateUserCashAdjustment(userId: number, cashAdjustment: number): Promise<void> {
    await db.update(users).set({ cashAdjustment }).where(eq(users.id, userId));
  }

  async updateUserSettings(userId: number, data: Record<string, any>): Promise<any> {
    const [user] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return user;
  }

  async getFixedExpenses(userId: number): Promise<FixedExpense[]> {
    return db.select().from(fixedExpenses).where(eq(fixedExpenses.userId, userId));
  }

  async createFixedExpense(userId: number, data: any): Promise<FixedExpense> {
    const [e] = await db.insert(fixedExpenses).values({ userId, ...data }).returning();
    return e;
  }

  async updateFixedExpense(id: number, data: any): Promise<FixedExpense> {
    const [e] = await db.update(fixedExpenses).set(data).where(eq(fixedExpenses.id, id)).returning();
    return e;
  }

  async deleteFixedExpense(id: number): Promise<void> {
    await db.delete(fixedExpenses).where(eq(fixedExpenses.id, id));
  }

  async getVariableExpenses(userId: number): Promise<VariableExpense[]> {
    return db.select().from(variableExpenses).where(eq(variableExpenses.userId, userId));
  }

  async createVariableExpense(userId: number, data: any): Promise<VariableExpense> {
    const [e] = await db.insert(variableExpenses).values({ userId, ...data }).returning();
    return e;
  }

  async updateVariableExpense(id: number, data: any): Promise<VariableExpense> {
    const [e] = await db.update(variableExpenses).set(data).where(eq(variableExpenses.id, id)).returning();
    return e;
  }

  async deleteVariableExpense(id: number): Promise<void> {
    await db.delete(variableExpenses).where(eq(variableExpenses.id, id));
  }

  async getCreditCards(userId: number): Promise<CreditCardExpense[]> {
    return db.select().from(creditCardExpenses).where(eq(creditCardExpenses.userId, userId));
  }

  async createCreditCard(userId: number, data: any): Promise<CreditCardExpense> {
    const [c] = await db.insert(creditCardExpenses).values({ userId, ...data }).returning();
    return c;
  }

  async updateCreditCard(id: number, data: any): Promise<CreditCardExpense> {
    const [c] = await db.update(creditCardExpenses).set(data).where(eq(creditCardExpenses.id, id)).returning();
    return c;
  }

  async deleteCreditCard(id: number): Promise<void> {
    await db.delete(creditCardExpenses).where(eq(creditCardExpenses.id, id));
  }

  async getLoans(userId: number): Promise<Loan[]> {
    return db.select().from(loans).where(eq(loans.userId, userId));
  }

  async createLoan(userId: number, data: any): Promise<Loan> {
    const [l] = await db.insert(loans).values({ userId, ...data }).returning();
    return l;
  }

  async updateLoan(id: number, data: any): Promise<Loan> {
    const [l] = await db.update(loans).set(data).where(eq(loans.id, id)).returning();
    return l;
  }

  async deleteLoan(id: number): Promise<void> {
    await db.delete(loans).where(eq(loans.id, id));
  }

  async getFixedIncomes(userId: number): Promise<FixedIncome[]> {
    return db.select().from(fixedIncomes).where(eq(fixedIncomes.userId, userId));
  }

  async createFixedIncome(userId: number, data: any): Promise<FixedIncome> {
    const [i] = await db.insert(fixedIncomes).values({ userId, ...data }).returning();
    return i;
  }

  async updateFixedIncome(id: number, data: any): Promise<FixedIncome> {
    const [i] = await db.update(fixedIncomes).set(data).where(eq(fixedIncomes.id, id)).returning();
    return i;
  }

  async deleteFixedIncome(id: number): Promise<void> {
    await db.delete(fixedIncomes).where(eq(fixedIncomes.id, id));
  }

  async getVariableIncomes(userId: number): Promise<VariableIncome[]> {
    return db.select().from(variableIncomes).where(eq(variableIncomes.userId, userId));
  }

  async createVariableIncome(userId: number, data: any): Promise<VariableIncome> {
    const [i] = await db.insert(variableIncomes).values({ userId, ...data }).returning();
    return i;
  }

  async updateVariableIncome(id: number, data: any): Promise<VariableIncome> {
    const [i] = await db.update(variableIncomes).set(data).where(eq(variableIncomes.id, id)).returning();
    return i;
  }

  async deleteVariableIncome(id: number): Promise<void> {
    await db.delete(variableIncomes).where(eq(variableIncomes.id, id));
  }

  async partialReceiveFixedIncome(id: number, receivedAmount: number): Promise<FixedIncome> {
    const [i] = await db.update(fixedIncomes).set({ receivedAmount }).where(eq(fixedIncomes.id, id)).returning();
    return i;
  }

  async partialReceiveVariableIncome(id: number, receivedAmount: number): Promise<VariableIncome> {
    const [i] = await db.update(variableIncomes).set({ receivedAmount }).where(eq(variableIncomes.id, id)).returning();
    return i;
  }

  async getExpectedIncomes(userId: number): Promise<ExpectedIncome[]> {
    return db.select().from(expectedIncomes).where(eq(expectedIncomes.userId, userId));
  }

  async createExpectedIncome(userId: number, data: any): Promise<ExpectedIncome> {
    const [i] = await db.insert(expectedIncomes).values({ userId, isApproved: false, ...data }).returning();
    return i;
  }

  async approveExpectedIncome(id: number): Promise<ExpectedIncome> {
    const [i] = await db.update(expectedIncomes).set({ isApproved: true }).where(eq(expectedIncomes.id, id)).returning();
    return i;
  }

  async deleteExpectedIncome(id: number): Promise<void> {
    await db.delete(expectedIncomes).where(eq(expectedIncomes.id, id));
  }

  async getWallets(userId: number): Promise<Wallet[]> {
    return db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async updateWallet(id: number, data: any): Promise<Wallet> {
    const [w] = await db.update(wallets).set(data).where(eq(wallets.id, id)).returning();
    return w;
  }

  async getIbans(userId: number): Promise<Iban[]> {
    return db.select().from(ibans).where(eq(ibans.userId, userId));
  }

  async createIban(userId: number, data: any): Promise<Iban> {
    const [i] = await db.insert(ibans).values({ userId, ...data }).returning();
    return i;
  }

  async updateIban(id: number, data: any): Promise<Iban> {
    const [item] = await db.update(ibans).set(data).where(eq(ibans.id, id)).returning();
    return item;
  }

  async deleteIban(id: number): Promise<void> {
    await db.delete(ibans).where(eq(ibans.id, id));
  }

  async getWalletCards(userId: number): Promise<WalletCard[]> {
    return db.select().from(walletCards).where(eq(walletCards.userId, userId));
  }

  async createWalletCard(userId: number, data: any): Promise<WalletCard> {
    const [c] = await db.insert(walletCards).values({ userId, ...data }).returning();
    return c;
  }

  async updateWalletCard(id: number, data: any): Promise<WalletCard> {
    const [item] = await db.update(walletCards).set(data).where(eq(walletCards.id, id)).returning();
    return item;
  }

  async deleteWalletCard(id: number): Promise<void> {
    await db.delete(walletCards).where(eq(walletCards.id, id));
  }

  async getSavings(userId: number): Promise<Savings[]> {
    return db.select().from(savings).where(eq(savings.userId, userId));
  }

  async upsertSavings(userId: number, currency: string, amount: number): Promise<Savings> {
    const existing = await db.select().from(savings).where(eq(savings.userId, userId));
    const found = existing.find(s => s.currency === currency);
    if (found) {
      const [s] = await db.update(savings).set({ amount }).where(eq(savings.id, found.id)).returning();
      return s;
    } else {
      const [s] = await db.insert(savings).values({ userId, currency, amount }).returning();
      return s;
    }
  }

  async getExtraSavings(userId: number): Promise<ExtraSavings[]> {
    return db.select().from(extraSavings).where(eq(extraSavings.userId, userId));
  }

  async upsertExtraSavings(userId: number, title: string, currency: string, amount: number): Promise<ExtraSavings> {
    const existing = await db.select().from(extraSavings).where(eq(extraSavings.userId, userId));
    const found = existing.find(s => s.title === title);
    if (found) {
      const [s] = await db.update(extraSavings).set({ amount }).where(eq(extraSavings.id, found.id)).returning();
      return s;
    } else {
      const [s] = await db.insert(extraSavings).values({ userId, title, currency, amount }).returning();
      return s;
    }
  }

  async addExtraSavingsAmount(id: number, addAmount: number): Promise<ExtraSavings> {
    const [current] = await db.select().from(extraSavings).where(eq(extraSavings.id, id));
    const newAmount = (current?.amount || 0) + addAmount;
    const [s] = await db.update(extraSavings).set({ amount: newAmount }).where(eq(extraSavings.id, id)).returning();
    return s;
  }

  async updateExtraSavingsInfo(id: number, title: string, currency: string): Promise<ExtraSavings> {
    const [s] = await db.update(extraSavings).set({ title, currency }).where(eq(extraSavings.id, id)).returning();
    return s;
  }

  async getSavingsTransactions(userId: number): Promise<any[]> {
    return db.select().from(savingsTransactions).where(eq(savingsTransactions.userId, userId));
  }

  async createSavingsTransaction(userId: number, data: { title: string; amountTL: number; currency: string; amount: number; date: string; isOffRecord?: boolean }): Promise<any> {
    const [t] = await db.insert(savingsTransactions).values({ userId, ...data }).returning();
    return t;
  }

  async deleteSavingsTransaction(id: number): Promise<void> {
    await db.delete(savingsTransactions).where(eq(savingsTransactions.id, id));
  }
}

export const storage = new DatabaseStorage();
