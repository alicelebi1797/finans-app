import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: any) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  req.userId = userId;
  next();
};

// Exchange rates cache
let ratesCache: { data: any; ts: number } | null = null;

async function getExchangeRates() {
  const now = Date.now();
  if (ratesCache && now - ratesCache.ts < 5 * 60 * 1000) return ratesCache.data;

  try {
    const [erRes, goldRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD'),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
    ]);

    const erData = await erRes.json();
    const goldData = await goldRes.json();

    const usdToTry = erData.rates?.TRY || 0;
    const eurToTry = usdToTry / (erData.rates?.EUR || 1);

    const goldUsdPerOz = goldData?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
    const goldGramTry = (goldUsdPerOz / 31.1035) * usdToTry;

    const data = {
      usd: Math.round(usdToTry * 100) / 100,
      eur: Math.round(eurToTry * 100) / 100,
      gold: Math.round(goldGramTry * 100) / 100,
      updatedAt: new Date().toISOString()
    };

    ratesCache = { data, ts: now };
    return data;
  } catch (err) {
    try {
      const erRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const erData = await erRes.json();
      const usdToTry = erData.rates?.TRY || 0;
      const eurToTry = usdToTry / (erData.rates?.EUR || 1);
      const data = { usd: Math.round(usdToTry * 100) / 100, eur: Math.round(eurToTry * 100) / 100, gold: 0, updatedAt: new Date().toISOString() };
      ratesCache = { data, ts: now };
      return data;
    } catch {
      return ratesCache?.data || { usd: 0, eur: 0, gold: 0, updatedAt: null };
    }
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth
  app.post(api.auth.login.path, async (req: Request, res: Response) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      (req.session as any).userId = user.id;
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session error" });
        res.json({ id: user.id, username: user.username, monthlyBudget: user.monthlyBudget });
      });
    } catch { res.status(400).json({ message: "Login failed" }); }
  });

  app.post(api.auth.logout.path, (req: Request, res: Response) => {
    req.session?.destroy(() => res.json({}));
  });

  const userPublic = (u: any) => ({
    id: u.id, username: u.username, displayName: u.displayName ?? '', isAdmin: u.isAdmin ?? false,
    monthlyBudget: u.monthlyBudget, cashAdjustment: u.cashAdjustment ?? 0,
    aliBank: u.aliBank ?? 0, kubraBank: u.kubraBank ?? 0, nakit: u.nakit ?? 0,
    distSlots: u.distSlots ?? '[]',
  });

  app.get(api.auth.me.path, (req: Request, res: Response) => {
    if ((req.session as any)?.userId) {
      storage.getUserById((req.session as any).userId).then(user => {
        res.json(user ? userPublic(user) : null);
      });
    } else {
      res.json(null);
    }
  });

  app.put('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { monthlyBudget, cashAdjustment, aliBank, kubraBank, nakit, distSlots, displayName } = req.body;
      const updateData: any = {};
      if (monthlyBudget !== undefined) updateData.monthlyBudget = Number(monthlyBudget);
      if (cashAdjustment !== undefined) updateData.cashAdjustment = Number(cashAdjustment);
      if (aliBank !== undefined) updateData.aliBank = Number(aliBank);
      if (kubraBank !== undefined) updateData.kubraBank = Number(kubraBank);
      if (nakit !== undefined) updateData.nakit = Number(nakit);
      if (distSlots !== undefined) updateData.distSlots = String(distSlots);
      if (displayName !== undefined) updateData.displayName = String(displayName);
      if (Object.keys(updateData).length > 0) await storage.updateUserSettings(req.userId!, updateData);
      const user = await storage.getUserById(req.userId!);
      res.json(user ? userPublic(user) : null);
    } catch { res.status(400).json({ message: "Güncellenemedi" }); }
  });

  // Admin middleware
  const adminMiddleware = async (req: Request, res: Response, next: any) => {
    const user = await storage.getUserById(req.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Yasak" });
    next();
  };

  // Admin user management
  app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    const list = await storage.listAllUsers();
    res.json(list.map(u => ({ id: u.id, username: u.username, displayName: u.displayName ?? '', isAdmin: u.isAdmin ?? false })));
  });

  app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { username, password, displayName } = req.body;
      if (!username || !password) return res.status(400).json({ message: "Kullanıcı adı ve şifre gerekli" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ message: "Bu kullanıcı adı zaten var" });
      const user = await storage.createUser(username, password);
      if (displayName) await storage.adminUpdateUser(user.id, { displayName });
      const updated = await storage.getUserById(user.id);
      res.status(201).json({ id: updated!.id, username: updated!.username, displayName: updated!.displayName ?? '', isAdmin: false });
    } catch { res.status(400).json({ message: "Oluşturulamadı" }); }
  });

  app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { username, password, displayName } = req.body;
      const user = await storage.adminUpdateUser(id, { username, password, displayName });
      res.json({ id: user.id, username: user.username, displayName: user.displayName ?? '', isAdmin: user.isAdmin ?? false });
    } catch (e: any) {
      if (e?.code === '23505') return res.status(409).json({ message: "Bu kullanıcı adı zaten var" });
      res.status(400).json({ message: "Güncellenemedi" });
    }
  });

  app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (id === req.userId) return res.status(400).json({ message: "Kendi hesabınızı silemezsiniz" });
      await storage.adminDeleteUser(id);
      res.status(204).send();
    } catch { res.status(400).json({ message: "Silinemedi" }); }
  });

  // Exchange rates
  app.get('/api/exchange-rates', authMiddleware, async (req: Request, res: Response) => {
    const data = await getExchangeRates();
    res.json(data);
  });

  // Fixed Expenses
  app.get(api.fixedExpenses.list.path, authMiddleware, async (req, res) => res.json(await storage.getFixedExpenses(req.userId!)));
  app.post(api.fixedExpenses.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createFixedExpense(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.fixedExpenses.update.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.updateFixedExpense(Number(req.params.id), req.body)); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.fixedExpenses.delete.path, authMiddleware, async (req, res) => { await storage.deleteFixedExpense(Number(req.params.id)); res.status(204).send(); });

  // Variable Expenses
  app.get(api.variableExpenses.list.path, authMiddleware, async (req, res) => res.json(await storage.getVariableExpenses(req.userId!)));
  app.post(api.variableExpenses.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createVariableExpense(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.variableExpenses.update.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.updateVariableExpense(Number(req.params.id), req.body)); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.variableExpenses.delete.path, authMiddleware, async (req, res) => { await storage.deleteVariableExpense(Number(req.params.id)); res.status(204).send(); });

  // Credit Cards
  app.get(api.creditCards.list.path, authMiddleware, async (req, res) => res.json(await storage.getCreditCards(req.userId!)));
  app.post(api.creditCards.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createCreditCard(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.creditCards.update.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.updateCreditCard(Number(req.params.id), req.body)); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.creditCards.delete.path, authMiddleware, async (req, res) => { await storage.deleteCreditCard(Number(req.params.id)); res.status(204).send(); });

  // Loans
  app.get(api.loans.list.path, authMiddleware, async (req, res) => res.json(await storage.getLoans(req.userId!)));
  app.post(api.loans.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createLoan(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.loans.update.path, authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (req.body.isPaid === true) {
        res.json(await storage.payLoanInstallment(id));
      } else {
        res.json(await storage.updateLoan(id, req.body));
      }
    } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.loans.delete.path, authMiddleware, async (req, res) => { await storage.deleteLoan(Number(req.params.id)); res.status(204).send(); });

  // Fixed Incomes
  app.get(api.fixedIncomes.list.path, authMiddleware, async (req, res) => res.json(await storage.getFixedIncomes(req.userId!)));
  app.post(api.fixedIncomes.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createFixedIncome(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.fixedIncomes.update.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.updateFixedIncome(Number(req.params.id), req.body)); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.fixedIncomes.delete.path, authMiddleware, async (req, res) => { await storage.deleteFixedIncome(Number(req.params.id)); res.status(204).send(); });
  app.patch('/api/fixed-incomes/:id/partial', authMiddleware, async (req, res) => {
    try { res.json(await storage.partialReceiveFixedIncome(Number(req.params.id), Number(req.body.receivedAmount))); } catch { res.status(400).json({ message: "Başarısız" }); }
  });

  // Variable Incomes
  app.get(api.variableIncomes.list.path, authMiddleware, async (req, res) => res.json(await storage.getVariableIncomes(req.userId!)));
  app.post(api.variableIncomes.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createVariableIncome(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.variableIncomes.update.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.updateVariableIncome(Number(req.params.id), req.body)); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.variableIncomes.delete.path, authMiddleware, async (req, res) => { await storage.deleteVariableIncome(Number(req.params.id)); res.status(204).send(); });
  app.patch('/api/variable-incomes/:id/partial', authMiddleware, async (req, res) => {
    try { res.json(await storage.partialReceiveVariableIncome(Number(req.params.id), Number(req.body.receivedAmount))); } catch { res.status(400).json({ message: "Başarısız" }); }
  });

  // Expected Incomes
  app.get(api.expectedIncomes.list.path, authMiddleware, async (req, res) => res.json(await storage.getExpectedIncomes(req.userId!)));
  app.post(api.expectedIncomes.create.path, authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createExpectedIncome(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put(api.expectedIncomes.approve.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.approveExpectedIncome(Number(req.params.id))); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });
  app.delete(api.expectedIncomes.delete.path, authMiddleware, async (req, res) => { await storage.deleteExpectedIncome(Number(req.params.id)); res.status(204).send(); });

  // Wallets
  app.get(api.wallets.list.path, authMiddleware, async (req, res) => res.json(await storage.getWallets(req.userId!)));
  app.put(api.wallets.update.path, authMiddleware, async (req, res) => {
    try { res.json(await storage.updateWallet(Number(req.params.id), req.body)); } catch { res.status(404).json({ message: "Bulunamadı" }); }
  });

  // IBANs
  app.get('/api/ibans', authMiddleware, async (req, res) => res.json(await storage.getIbans(req.userId!)));
  app.post('/api/ibans', authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createIban(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put('/api/ibans/:id', authMiddleware, async (req, res) => {
    try { res.json(await storage.updateIban(Number(req.params.id), req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.delete('/api/ibans/:id', authMiddleware, async (req, res) => { await storage.deleteIban(Number(req.params.id)); res.status(204).send(); });

  // Wallet Cards
  app.get('/api/wallet-cards', authMiddleware, async (req, res) => res.json(await storage.getWalletCards(req.userId!)));
  app.post('/api/wallet-cards', authMiddleware, async (req, res) => {
    try { res.status(201).json(await storage.createWalletCard(req.userId!, req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put('/api/wallet-cards/:id', authMiddleware, async (req, res) => {
    try { res.json(await storage.updateWalletCard(Number(req.params.id), req.body)); } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.delete('/api/wallet-cards/:id', authMiddleware, async (req, res) => { await storage.deleteWalletCard(Number(req.params.id)); res.status(204).send(); });

  // Savings
  app.get('/api/savings', authMiddleware, async (req, res) => res.json(await storage.getSavings(req.userId!)));
  app.put('/api/savings/:currency', authMiddleware, async (req, res) => {
    try {
      const currency = req.params.currency.toUpperCase();
      const newAmount = Number(req.body.amount);
      const currentSavings = await storage.getSavings(req.userId!);
      const current = currentSavings.find(s => s.currency === currency);
      const oldAmount = current?.amount ?? 0;
      const delta = newAmount - oldAmount;
      const data = await storage.upsertSavings(req.userId!, currency, newAmount);
      if (delta !== 0) {
        const rates = await getExchangeRates();
        let rate = 1;
        if (currency === 'USD') rate = rates.usd ?? 1;
        else if (currency === 'EUR') rate = rates.eur ?? 1;
        else if (currency === 'GOLD') rate = rates.gold ?? 1;
        const amountTL = Math.round(delta * rate);
        const today = new Date().toISOString().split('T')[0];
        const labels: Record<string, string> = { USD: 'Dolar', EUR: 'Euro', GOLD: 'Gram Altın' };
        const action = delta > 0 ? 'Birikim' : 'Çekim';
        await storage.createSavingsTransaction(req.userId!, { title: `${action} — ${labels[currency] || currency}`, amountTL, currency, amount: delta, date: today });
      }
      res.json(data);
    } catch { res.status(400).json({ message: "Başarısız" }); }
  });

  // Off-record savings add (adds to balance but NOT deducted from cashOnHand)
  app.post('/api/savings/:currency/off-record', authMiddleware, async (req, res) => {
    try {
      const currency = req.params.currency.toUpperCase();
      const addAmount = Number(req.body.amount);
      if (!addAmount || addAmount <= 0) return res.status(400).json({ message: "Geçersiz miktar" });
      const currentSavings = await storage.getSavings(req.userId!);
      const current = currentSavings.find(s => s.currency === currency);
      const oldAmount = current?.amount ?? 0;
      const newAmount = oldAmount + addAmount;
      const data = await storage.upsertSavings(req.userId!, currency, newAmount);
      const rates = await getExchangeRates();
      let rate = 1;
      if (currency === 'USD') rate = rates.usd ?? 1;
      else if (currency === 'EUR') rate = rates.eur ?? 1;
      else if (currency === 'GOLD') rate = rates.gold ?? 1;
      const amountTL = Math.round(addAmount * rate);
      const today = new Date().toISOString().split('T')[0];
      const labels: Record<string, string> = { USD: 'Dolar', EUR: 'Euro', GOLD: 'Gram Altın' };
      await storage.createSavingsTransaction(req.userId!, {
        title: `Kayıt Dışı Birikim — ${labels[currency] || currency}`,
        amountTL, currency, amount: addAmount, date: today, isOffRecord: true,
      });
      res.json(data);
    } catch { res.status(400).json({ message: "Başarısız" }); }
  });

  // Savings Transactions
  app.get('/api/savings-transactions', authMiddleware, async (req, res) => res.json(await storage.getSavingsTransactions(req.userId!)));
  app.delete('/api/savings-transactions/:id', authMiddleware, async (req, res) => { await storage.deleteSavingsTransaction(Number(req.params.id)); res.status(204).send(); });

  // Extra Savings (family savings)
  app.get('/api/extra-savings', authMiddleware, async (req, res) => res.json(await storage.getExtraSavings(req.userId!)));
  app.post('/api/extra-savings', authMiddleware, async (req, res) => {
    try {
      const { title, currency, amount } = req.body;
      const data = await storage.upsertExtraSavings(req.userId!, title, currency || 'GOLD', Number(amount) || 0);
      res.json(data);
    } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.put('/api/extra-savings/:id/add', authMiddleware, async (req, res) => {
    try {
      const addAmount = Number(req.body.amount);
      const data = await storage.addExtraSavingsAmount(Number(req.params.id), addAmount);
      if (addAmount > 0) {
        const extraList = await storage.getExtraSavings(req.userId!);
        const extraItem = extraList.find(s => s.id === Number(req.params.id));
        if (extraItem) {
          const rates = await getExchangeRates();
          let rate = 1;
          if (extraItem.currency === 'USD') rate = rates.usd ?? 1;
          else if (extraItem.currency === 'EUR') rate = rates.eur ?? 1;
          else if (extraItem.currency === 'GOLD') rate = rates.gold ?? 1;
          const amountTL = Math.round(addAmount * rate);
          const today = new Date().toISOString().split('T')[0];
          await storage.createSavingsTransaction(req.userId!, { title: extraItem.title, amountTL, currency: extraItem.currency, amount: addAmount, date: today });
        }
      }
      res.json(data);
    } catch { res.status(400).json({ message: "Başarısız" }); }
  });
  app.patch('/api/extra-savings/:id/info', authMiddleware, async (req, res) => {
    try {
      const { title, currency } = req.body;
      const data = await storage.updateExtraSavingsInfo(Number(req.params.id), title, currency);
      res.json(data);
    } catch { res.status(400).json({ message: "Başarısız" }); }
  });

  app.put('/api/extra-savings/:id', authMiddleware, async (req, res) => {
    try {
      const { amount } = req.body;
      const existing = await storage.getExtraSavings(req.userId!);
      const item = existing.find(s => s.id === Number(req.params.id));
      if (!item) return res.status(404).json({ message: "Bulunamadı" });
      const data = await storage.upsertExtraSavings(req.userId!, item.title, item.currency, Number(amount));
      res.json(data);
    } catch { res.status(400).json({ message: "Başarısız" }); }
  });

  // Planning Data
  app.get('/api/planning', authMiddleware, async (req, res) => {
    try { res.json(await storage.getPlanningData(req.userId!)); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.put('/api/planning', authMiddleware, async (req, res) => {
    try { await storage.updatePlanningData(req.userId!, req.body); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Monthly Reset — manual trigger + scheduled cron
  app.post('/api/monthly-reset', authMiddleware, async (req, res) => {
    try {
      await storage.monthlyReset(req.userId!);
      res.json({ success: true, message: "Aylık sıfırlama tamamlandı" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const scheduleMonthlyReset = () => {
    const checkAndReset = async () => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
        try {
          const allUsers = await storage.getUserByUsername('kalicelebi');
          if (allUsers) {
            await storage.monthlyReset(allUsers.id);
            console.log(`[monthly-reset] Aylık sıfırlama tamamlandı — ${now.toISOString()}`);
          }
        } catch (e) {
          console.error('[monthly-reset] Hata:', e);
        }
      }
    };
    setInterval(checkAndReset, 60 * 1000);
    console.log('[monthly-reset] Aylık sıfırlama zamanlayıcısı başlatıldı');
  };

  scheduleMonthlyReset();

  // Chat
  app.post(api.chat.message.path, authMiddleware, async (req: Request, res: Response) => {
    try {
      const input = api.chat.message.input.parse(req.body);
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Sen profesyonel bir Türk finans danışmanısın. Türkçe cevap ver. Kısa, net ve pratik tavsiye ver." },
          { role: "user", content: input.message }
        ],
      });
      res.json({ response: response.choices[0].message.content || "Üzgünüm, bir hata oluştu." });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  return httpServer;
}
