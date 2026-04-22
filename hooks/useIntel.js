import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function useIntel() {
  // We point directly to the public file URL
  // Replace 'ksi-dashboard-dusky' with your actual vercel app name if different
  const { data, error, isLoading } = useSWR('https://ksi-dashboard-dusky.vercel.app/intel.json', fetcher, {
    refreshInterval: 5000,
  });

  return {
    intelligenceData: data,
    isLoading,
    isError: error,
  };
}
