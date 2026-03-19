--
-- PostgreSQL database dump
--

\restrict ctMA0v4jlQSwX7agNKcRUgQ7fWCzxDWD55EpgAofcUb3bZ7dYC1o6Hj3elHS4dX

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: credit_card_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_card_expenses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    card_name text NOT NULL,
    card_number text NOT NULL,
    card_expiry text NOT NULL,
    amount integer NOT NULL,
    payment_day integer NOT NULL,
    is_paid boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cvv text DEFAULT ''::text NOT NULL,
    card_holder text DEFAULT ''::text NOT NULL
);


--
-- Name: credit_card_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_card_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_card_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_card_expenses_id_seq OWNED BY public.credit_card_expenses.id;


--
-- Name: expected_incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expected_incomes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    amount integer NOT NULL,
    expected_day integer,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expected_incomes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expected_incomes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expected_incomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expected_incomes_id_seq OWNED BY public.expected_incomes.id;


--
-- Name: extra_savings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_savings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    currency text DEFAULT 'GOLD'::text NOT NULL,
    amount real DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: extra_savings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.extra_savings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: extra_savings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.extra_savings_id_seq OWNED BY public.extra_savings.id;


--
-- Name: fixed_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fixed_expenses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    amount integer NOT NULL,
    day integer NOT NULL,
    is_paid boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fixed_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fixed_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fixed_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fixed_expenses_id_seq OWNED BY public.fixed_expenses.id;


--
-- Name: fixed_incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fixed_incomes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    amount integer NOT NULL,
    day integer NOT NULL,
    is_received boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: fixed_incomes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fixed_incomes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fixed_incomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fixed_incomes_id_seq OWNED BY public.fixed_incomes.id;


--
-- Name: ibans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ibans (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    iban text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ibans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ibans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ibans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ibans_id_seq OWNED BY public.ibans.id;


--
-- Name: loans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loans (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    monthly_payment integer NOT NULL,
    remaining_installments integer NOT NULL,
    total_installments integer NOT NULL,
    last_payment_date integer NOT NULL,
    iban_for_payment text NOT NULL,
    is_paid boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_date text,
    last_paid_at text
);


--
-- Name: loans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loans_id_seq OWNED BY public.loans.id;


--
-- Name: savings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.savings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    currency text NOT NULL,
    amount real DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: savings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.savings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: savings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.savings_id_seq OWNED BY public.savings.id;


--
-- Name: savings_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.savings_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    amount_tl integer NOT NULL,
    currency text DEFAULT 'TRY'::text NOT NULL,
    amount real DEFAULT 0 NOT NULL,
    date text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: savings_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.savings_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: savings_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.savings_transactions_id_seq OWNED BY public.savings_transactions.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    monthly_budget integer DEFAULT 25000,
    cash_adjustment integer DEFAULT 0,
    ali_bank integer DEFAULT 0,
    kubra_bank integer DEFAULT 0,
    nakit integer DEFAULT 0,
    planning_data text DEFAULT '{}'::text,
    is_admin boolean DEFAULT false,
    display_name text DEFAULT ''::text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: variable_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variable_expenses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    amount integer NOT NULL,
    day integer NOT NULL,
    is_paid boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: variable_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.variable_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: variable_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.variable_expenses_id_seq OWNED BY public.variable_expenses.id;


--
-- Name: variable_incomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variable_incomes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    amount integer NOT NULL,
    expected_day integer,
    is_received boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: variable_incomes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.variable_incomes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: variable_incomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.variable_incomes_id_seq OWNED BY public.variable_incomes.id;


--
-- Name: wallet_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_cards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    card_name text NOT NULL,
    card_number text NOT NULL,
    card_expiry text NOT NULL,
    card_type text DEFAULT 'credit'::text NOT NULL,
    bank_name text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wallet_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wallet_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallet_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wallet_cards_id_seq OWNED BY public.wallet_cards.id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    balance integer DEFAULT 0,
    label text NOT NULL,
    value text NOT NULL,
    amount integer NOT NULL,
    quantity integer NOT NULL,
    icon_type text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wallets_id_seq OWNED BY public.wallets.id;


--
-- Name: credit_card_expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_expenses ALTER COLUMN id SET DEFAULT nextval('public.credit_card_expenses_id_seq'::regclass);


--
-- Name: expected_incomes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expected_incomes ALTER COLUMN id SET DEFAULT nextval('public.expected_incomes_id_seq'::regclass);


--
-- Name: extra_savings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_savings ALTER COLUMN id SET DEFAULT nextval('public.extra_savings_id_seq'::regclass);


--
-- Name: fixed_expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_expenses ALTER COLUMN id SET DEFAULT nextval('public.fixed_expenses_id_seq'::regclass);


--
-- Name: fixed_incomes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_incomes ALTER COLUMN id SET DEFAULT nextval('public.fixed_incomes_id_seq'::regclass);


--
-- Name: ibans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ibans ALTER COLUMN id SET DEFAULT nextval('public.ibans_id_seq'::regclass);


--
-- Name: loans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans ALTER COLUMN id SET DEFAULT nextval('public.loans_id_seq'::regclass);


--
-- Name: savings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings ALTER COLUMN id SET DEFAULT nextval('public.savings_id_seq'::regclass);


--
-- Name: savings_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings_transactions ALTER COLUMN id SET DEFAULT nextval('public.savings_transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: variable_expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variable_expenses ALTER COLUMN id SET DEFAULT nextval('public.variable_expenses_id_seq'::regclass);


--
-- Name: variable_incomes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variable_incomes ALTER COLUMN id SET DEFAULT nextval('public.variable_incomes_id_seq'::regclass);


--
-- Name: wallet_cards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_cards ALTER COLUMN id SET DEFAULT nextval('public.wallet_cards_id_seq'::regclass);


--
-- Name: wallets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets ALTER COLUMN id SET DEFAULT nextval('public.wallets_id_seq'::regclass);


--
-- Name: credit_card_expenses credit_card_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_expenses
    ADD CONSTRAINT credit_card_expenses_pkey PRIMARY KEY (id);


--
-- Name: expected_incomes expected_incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expected_incomes
    ADD CONSTRAINT expected_incomes_pkey PRIMARY KEY (id);


--
-- Name: extra_savings extra_savings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_savings
    ADD CONSTRAINT extra_savings_pkey PRIMARY KEY (id);


--
-- Name: fixed_expenses fixed_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_expenses
    ADD CONSTRAINT fixed_expenses_pkey PRIMARY KEY (id);


--
-- Name: fixed_incomes fixed_incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_incomes
    ADD CONSTRAINT fixed_incomes_pkey PRIMARY KEY (id);


--
-- Name: ibans ibans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ibans
    ADD CONSTRAINT ibans_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: savings savings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings
    ADD CONSTRAINT savings_pkey PRIMARY KEY (id);


--
-- Name: savings_transactions savings_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings_transactions
    ADD CONSTRAINT savings_transactions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: variable_expenses variable_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variable_expenses
    ADD CONSTRAINT variable_expenses_pkey PRIMARY KEY (id);


--
-- Name: variable_incomes variable_incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variable_incomes
    ADD CONSTRAINT variable_incomes_pkey PRIMARY KEY (id);


--
-- Name: wallet_cards wallet_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_cards
    ADD CONSTRAINT wallet_cards_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.user_sessions USING btree (expire);


--
-- Name: credit_card_expenses credit_card_expenses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_expenses
    ADD CONSTRAINT credit_card_expenses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: expected_incomes expected_incomes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expected_incomes
    ADD CONSTRAINT expected_incomes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: extra_savings extra_savings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_savings
    ADD CONSTRAINT extra_savings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: fixed_expenses fixed_expenses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_expenses
    ADD CONSTRAINT fixed_expenses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: fixed_incomes fixed_incomes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_incomes
    ADD CONSTRAINT fixed_incomes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ibans ibans_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ibans
    ADD CONSTRAINT ibans_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: loans loans_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: savings_transactions savings_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings_transactions
    ADD CONSTRAINT savings_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: savings savings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.savings
    ADD CONSTRAINT savings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: variable_expenses variable_expenses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variable_expenses
    ADD CONSTRAINT variable_expenses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: variable_incomes variable_incomes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variable_incomes
    ADD CONSTRAINT variable_incomes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet_cards wallet_cards_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_cards
    ADD CONSTRAINT wallet_cards_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ctMA0v4jlQSwX7agNKcRUgQ7fWCzxDWD55EpgAofcUb3bZ7dYC1o6Hj3elHS4dX

