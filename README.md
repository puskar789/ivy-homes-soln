# ivy-homes-soln

# Approach

Initially, I attempted a Depth-First Search (DFS) approach for extracting names from the autocomplete API. The idea was to recursively explore each prefix in a depth-first manner. However, I encountered two major issues: the execution was slow since each prefix was explored in depth before moving to the next, leading to many redundant API calls for long prefixes that didn’t return additional results. Additionally, we frequently encountered HTTP 429 errors due to rate limiting, which forced us to back off and further slowed down the extraction process.

Here, prefix of maximum lengths 2, 3 and 3 were used for v1, v2 and v3 respectively.

To improve performance, we switched to a Breadth-First Search (BFS) approach. BFS allowed to process shorter prefixes first before expanding into longer ones, making our queries more efficient and reducing redundant requests. I started with single-character prefixes derived from an expanded set of characters including a-z, 0-9, +, -, ., and spaces. For each prefix, I queried the API and stored the results. If the API returned the maximum number of results, which indicated that more names existed under that prefix, we expanded it further by appending each character from our candidate set and processed them in the next iteration. I also implemented a batching strategy to limit concurrent requests, ensuring I didn’t exceed the rate limit by making too many requests at once. Additionally, I introduced a small delay between batches to reduce server overload and prevent 429 errors.

# Findings

Through our testing, I found that Version 1 (v1) of the API returns a maximum of 10 results per request, Version 2 (v2) returns a maximum of 12 results, and Version 3 (v3) returns a maximum of 15 results.

For v1:

Total unique names found: 6720
Total API requests made: 7180

For v2:

Total unique names found: 9140
Total API requests made: 47772

For v3:

Total unique names found: 8544
Total API requests made: 31846
