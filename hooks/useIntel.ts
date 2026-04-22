import useSWR from 'swr';

// Define the shape of our data
interface IntelItem {
  id: number;
  sector: string;
  title: string;
  date: string;
  interpretation: string;
  opportunity: string;
  risk: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function useIntel() {
  // Fetching directly from GitHub Raw file
  const { data, error, isLoading } = useSWR<IntelItem[]>(
    'https://raw.githubusercontent.com/arnokey123/ksi-dashboard/master/public/intel.json', 
    fetcher, 
    {
      refreshInterval: 5000,
    }
  );

  return {
    intelligenceData: data,
    isLoading,
    isError: error,
  };
}
