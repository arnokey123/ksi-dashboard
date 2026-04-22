import useSWR from 'swr';

// The fetcher function handles the API call
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function useIntel() {
  // SWR Configuration:
  // refreshInterval: 5000 means it checks for updates every 5 seconds automatically.
  // revalidateOnFocus: true means it updates immediately if the user switches tabs back.
  const { data, error, isLoading } = useSWR('/api/intel', fetcher, {
    refreshInterval: 5000, 
    revalidateOnFocus: true,
  });

  return {
    intelligenceData: data,
    isLoading,
    isError: error,
  };
}
