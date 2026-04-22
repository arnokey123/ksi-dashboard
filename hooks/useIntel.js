import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function useIntel() {
  // Fetching directly from GitHub Raw file
  const { data, error, isLoading } = useSWR(
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

