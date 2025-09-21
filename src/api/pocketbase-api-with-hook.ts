// Alternative implementation using PocketBase custom endpoint
// Replace the getAccountPerformance method with this:

getAccountPerformance: async (
  userId: string,
  timeRange: TimeRange,
  accountIds: string[],
) => {
  if (accountIds.length === 0) return [];

  try {
    const startDate = getStartDateForTimeRange(timeRange);
    const endDate = new Date();

    // Call custom PocketBase endpoint
    const response = await fetch(`${pb.baseUrl}/api/account-performance?user_id=${userId}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&account_ids=${accountIds.join(',')}`, {
      headers: {
        'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    handleError(error as PocketBaseError, "getAccountPerformance");
  }
},