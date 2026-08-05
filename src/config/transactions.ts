export const FEE_RATE = 0.001;

export type Transaction = {
  ref: string;
  ticker: string;
  /** Coin name, under the ticker. */
  company: string;
  side: "buy" | "sell";
  quantity: number;
  /** Unit price in USD at the time of the order. */
  price: number;
  date: string;
  time: string;
  status: "processing" | "success" | "declined";
  email: string;
  avatar: string | null;
  initials: string;
};

/** Prices match `@/config/market`, so a row and the trade pages agree on a rate. */
export const TRANSACTIONS: Transaction[] = [
  {
    ref: "TXN-90418",
    ticker: "BTC",
    company: "Bitcoin",
    side: "buy",
    quantity: 0.25,
    price: 43009,
    date: "Aug 2, 2026",
    time: "09:41",
    status: "processing",
    email: "olivia@compani.com",
    avatar: "/assets/download/aveter.webp",
    initials: "OC",
  },
  {
    ref: "TXN-90417",
    ticker: "ETH",
    company: "Ethereum",
    side: "sell",
    quantity: 1.5,
    price: 2284.5,
    date: "Aug 2, 2026",
    time: "11:07",
    status: "success",
    email: "phoenix@compani.com",
    avatar: "/assets/download/aveter-two.webp",
    initials: "PC",
  },
  {
    ref: "TXN-90411",
    ticker: "USDT",
    company: "Tether",
    side: "buy",
    quantity: 5000,
    price: 1,
    date: "Aug 1, 2026",
    time: "15:22",
    status: "success",
    email: "lana@compani.com",
    avatar: null,
    initials: "LS",
  },
  {
    ref: "TXN-90404",
    ticker: "DOGE",
    company: "Dogecoin",
    side: "sell",
    quantity: 8500,
    price: 0.1642,
    date: "Jul 30, 2026",
    time: "10:15",
    status: "declined",
    email: "demi@compani.com",
    avatar: null,
    initials: "DW",
  },
  {
    ref: "TXN-90396",
    ticker: "SOL",
    company: "Solana",
    side: "sell",
    quantity: 18.4,
    price: 98.42,
    date: "Jul 29, 2026",
    time: "08:52",
    status: "success",
    email: "olivia@compani.com",
    avatar: "/assets/download/aveter.webp",
    initials: "OC",
  },
  {
    ref: "TXN-90388",
    ticker: "XRP",
    company: "XRP",
    side: "buy",
    quantity: 3200,
    price: 0.6214,
    date: "Jul 28, 2026",
    time: "17:04",
    status: "success",
    email: "noah@compani.com",
    avatar: null,
    initials: "NB",
  },
  {
    ref: "TXN-90375",
    ticker: "BTC",
    company: "Bitcoin",
    side: "sell",
    quantity: 0.08,
    price: 43009,
    date: "Jul 27, 2026",
    time: "13:38",
    status: "processing",
    email: "phoenix@compani.com",
    avatar: "/assets/download/aveter-two.webp",
    initials: "PC",
  },
  {
    ref: "TXN-90362",
    ticker: "ETH",
    company: "Ethereum",
    side: "buy",
    quantity: 0.75,
    price: 2284.5,
    date: "Jul 25, 2026",
    time: "20:11",
    status: "success",
    email: "lana@compani.com",
    avatar: null,
    initials: "LS",
  },
  {
    ref: "TXN-90350",
    ticker: "SOL",
    company: "Solana",
    side: "buy",
    quantity: 42,
    price: 98.42,
    date: "Jul 24, 2026",
    time: "07:26",
    status: "declined",
    email: "demi@compani.com",
    avatar: null,
    initials: "DW",
  },
  {
    ref: "TXN-90341",
    ticker: "DOGE",
    company: "Dogecoin",
    side: "buy",
    quantity: 12000,
    price: 0.1642,
    date: "Jul 22, 2026",
    time: "12:49",
    status: "success",
    email: "noah@compani.com",
    avatar: null,
    initials: "NB",
  },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export const txAmount = (tx: Transaction) => round2(tx.quantity * tx.price);
export const txFee = (tx: Transaction) => round2(txAmount(tx) * FEE_RATE);

/** How many rows the overview panel shows before the page takes over. */
export const TRANSACTIONS_PREVIEW = 4;
