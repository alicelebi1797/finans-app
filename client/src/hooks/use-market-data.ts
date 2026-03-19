import { useQuery } from "@tanstack/react-query";

export interface MarketData {
  code: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
  up: boolean;
}

export function useMarketData() {
  return useQuery({
    queryKey: ["market-data"],
    queryFn: async (): Promise<MarketData[]> => {
      try {
        const response = await fetch("https://finans.truncgil.com/today.json");
        const data = await response.json();
        
        const parseNumber = (val: string) => {
          if (!val) return 0;
          return parseFloat(val.replace(/\./g, "").replace(",", "."));
        };

        const parseChange = (val: string) => {
          if (!val) return 0;
          return parseFloat(val.replace("%", "").replace(/\./g, "").replace(",", "."));
        };
        
        return [
          { 
            code: "USD", 
            name: "Dolar", 
            buy: parseNumber(data.USD.Alış), 
            sell: parseNumber(data.USD.Satış), 
            change: parseChange(data.USD.Değişim), 
            up: parseChange(data.USD.Değişim) >= 0 
          },
          { 
            code: "EUR", 
            name: "Euro", 
            buy: parseNumber(data.EUR.Alış), 
            sell: parseNumber(data.EUR.Satış), 
            change: parseChange(data.EUR.Değişim), 
            up: parseChange(data.EUR.Değişim) >= 0 
          },
          { 
            code: "GA", 
            name: "Gram Altın", 
            buy: parseNumber(data["gram-altin"].Alış), 
            sell: parseNumber(data["gram-altin"].Satış), 
            change: parseChange(data["gram-altin"].Değişim), 
            up: parseChange(data["gram-altin"].Değişim) >= 0 
          }
        ];
      } catch (err) {
        console.error("Failed to fetch market data, using fallbacks", err);
        // Fallback mock data if API fails
        return [
          { code: "USD", name: "Dolar", buy: 34.10, sell: 34.25, change: 0.15, up: true },
          { code: "EUR", name: "Euro", buy: 36.80, sell: 37.05, change: -0.10, up: false },
          { code: "GA", name: "Gram Altın", buy: 3000, sell: 3050, change: 1.2, up: true },
        ];
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
