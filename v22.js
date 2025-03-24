const fs = require("fs");

const BASE_URL = "http://35.200.185.69:8000";
const ENDPOINT = "/v2/autocomplete";
const RESULT_LIMIT = 12;
const SLEEP_INTERVAL = 200;
const MAX_CONCURRENT_REQUESTS = 10;

let apiRequestCount = 0;
const allNames = new Set();

const candidateChars = "abcdefghijklmnopqrstuvwxyz0123456789+- .";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function queryApi(prefix) {
  const url = `${BASE_URL}${ENDPOINT}?query=${encodeURIComponent(prefix)}`;
  try {
    const response = await fetch(url);
    apiRequestCount++;

    if (response.status === 429) {
      console.log(`Rate limited on prefix "${prefix}". Backing off...`);
      await sleep(1000);
      return queryApi(prefix);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    const names = data.results;
    console.log(`Response for prefix "${prefix}":`, names);
    return names;
  } catch (error) {
    console.error(`Error querying prefix "${prefix}":`, error.message);
    return [];
  }
}

async function bfsSearch() {
  let currentPrefixes = candidateChars.split("");
  let nextPrefixes = [];

  while (currentPrefixes.length > 0) {
    console.log(`Processing ${currentPrefixes.length} prefixes...`);
    const batch = [];

    for (const prefix of currentPrefixes) {
      if (prefix.length > 3) {
        continue;
      }

      batch.push(
        queryApi(prefix).then((names) => {
          names.forEach((name) => allNames.add(name));
          if (names.length === RESULT_LIMIT) {
            for (const char of candidateChars) {
              nextPrefixes.push(prefix + char);
            }
          }
        })
      );

      if (batch.length >= MAX_CONCURRENT_REQUESTS) {
        await Promise.all(batch);
        batch.length = 0;
        await sleep(SLEEP_INTERVAL);
      }
    }

    await Promise.all(batch);

    currentPrefixes = nextPrefixes;
    nextPrefixes = [];
  }
}

async function main() {
  await bfsSearch();

  console.log("Total unique names found:", allNames.size);
  console.log("Total API requests made:", apiRequestCount);
  fs.writeFileSync(
    "extracted_names_v22.txt",
    Array.from(allNames).sort().join("\n")
  );
}

main();
