import { pgTable, text, serial, integer, boolean, timestamp, decimal, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  displayName: text("display_name").default(""),
  monthlyBudget: integer("monthly_budget").default(25000),
  cashAdjustment: integer("cash_adjustment").default(0),
  aliBank: integer("ali_bank").default(0),
  kubraBank: integer("kubra_bank").default(0),
  nakit: integer("nakit").default(0),
  planningData: text("planning_data").default('{}'),
  distSlots: text("dist_slots").default('[]'),
});

export const fixedExpenses = pgTable("fixed_expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  day: integer("day").notNull(),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const variableExpenses = pgTable("variable_expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  day: integer("day").notNull(),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const creditCardExpenses = pgTable("credit_card_expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardName: text("card_name").notNull(),
  cardHolder: text("card_holder").notNull().default(""),
  cardNumber: text("card_number").notNull(),
  cardExpiry: text("card_expiry").notNull(),
  cvv: text("cvv").notNull().default(""),
  amount: integer("amount").notNull(),
  paymentDay: integer("payment_day").notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAmount: integer("paid_amount").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  monthlyPayment: integer("monthly_payment").notNull(),
  remainingInstallments: integer("remaining_installments").notNull(),
  totalInstallments: integer("total_installments").notNull(),
  lastPaymentDate: integer("last_payment_date").notNull(),
  ibanForPayment: text("iban_for_payment").notNull(),
  isPaid: boolean("is_paid").default(false),
  endDate: text("end_date"),
  lastPaidAt: text("last_paid_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const fixedIncomes = pgTable("fixed_incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  day: integer("day").notNull(),
  isReceived: boolean("is_received").default(false),
  receivedAmount: integer("received_amount").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const variableIncomes = pgTable("variable_incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  expectedDay: integer("expected_day"),
  isReceived: boolean("is_received").default(false),
  receivedAmount: integer("received_amount").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const expectedIncomes = pgTable("expected_incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  expectedDay: integer("expected_day"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").default(0),
  label: text("label").notNull(),
  value: text("value").notNull(),
  amount: integer("amount").notNull(),
  quantity: integer("quantity").notNull(),
  iconType: text("icon_type").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// IBAN listesi
export const ibans = pgTable("ibans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  iban: text("iban").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Cüzdandaki kartlar (banka + kredi)
export const walletCards = pgTable("wallet_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardName: text("card_name").notNull(),
  cardNumber: text("card_number").notNull(),
  cardExpiry: text("card_expiry").notNull(),
  cardType: text("card_type").notNull().default("credit"),
  bankName: text("bank_name").notNull().default(""),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Birikim (döviz ve altın)
export const savings = pgTable("savings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull(),
  amount: real("amount").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Harici birikimler (hesap dışı - örn. baba için altın birikimi)
export const extraSavings = pgTable("extra_savings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  currency: text("currency").notNull().default("GOLD"),
  amount: real("amount").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Birikim işlemleri (TL karşılığı ile tarihli kayıt)
export const savingsTransactions = pgTable("savings_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amountTL: integer("amount_tl").notNull(),
  currency: text("currency").notNull().default("TRY"),
  amount: real("amount").notNull().default(0),
  date: text("date").notNull(),
  isOffRecord: boolean("is_off_record").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertFixedExpenseSchema = createInsertSchema(fixedExpenses).omit({ id: true, createdAt: true });
export const insertVariableExpenseSchema = createInsertSchema(variableExpenses).omit({ id: true, createdAt: true });
export const insertCreditCardSchema = createInsertSchema(creditCardExpenses).omit({ id: true, createdAt: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, createdAt: true });
export const insertFixedIncomeSchema = createInsertSchema(fixedIncomes).omit({ id: true, createdAt: true });
export const insertVariableIncomeSchema = createInsertSchema(variableIncomes).omit({ id: true, createdAt: true });
export const insertExpectedIncomeSchema = createInsertSchema(expectedIncomes).omit({ id: true, createdAt: true });
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true });
export const insertIbanSchema = createInsertSchema(ibans).omit({ id: true, createdAt: true });
export const insertWalletCardSchema = createInsertSchema(walletCards).omit({ id: true, createdAt: true });
export const insertSavingsSchema = createInsertSchema(savings).omit({ id: true, createdAt: true });
export const insertExtraSavingsSchema = createInsertSchema(extraSavings).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FixedExpense = typeof fixedExpenses.$inferSelect;
export type VariableExpense = typeof variableExpenses.$inferSelect;
export type CreditCardExpense = typeof creditCardExpenses.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type FixedIncome = typeof fixedIncomes.$inferSelect;
export type VariableIncome = typeof variableIncomes.$inferSelect;
export type ExpectedIncome = typeof expectedIncomes.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Iban = typeof ibans.$inferSelect;
export type WalletCard = typeof walletCards.$inferSelect;
export type Savings = typeof savings.$inferSelect;
export type ExtraSavings = typeof extraSavings.$inferSelect;
