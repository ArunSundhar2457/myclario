import { describe, expect, it } from "vitest";
import { fetchAllRows } from "../paginate";

/** Fake table of `n` rows that behaves like a Supabase range() query. */
function fakeTable(n: number) {
  const calls: [number, number][] = [];
  const fetchPage = async (from: number, to: number) => {
    calls.push([from, to]);
    const data: number[] = [];
    for (let i = from; i <= to && i < n; i++) data.push(i);
    return { data, error: null };
  };
  return { fetchPage, calls };
}

describe("fetchAllRows", () => {
  it("returns an empty list for an empty table", async () => {
    const t = fakeTable(0);
    expect(await fetchAllRows(t.fetchPage, 1000)).toEqual([]);
    expect(t.calls).toHaveLength(1);
  });

  it("reads every row past the 1,000-row cap", async () => {
    const t = fakeTable(2500);
    const rows = await fetchAllRows(t.fetchPage, 1000);
    expect(rows).toHaveLength(2500);
    expect(rows[0]).toBe(0);
    expect(rows[2499]).toBe(2499);
    expect(new Set(rows).size).toBe(2500); // no duplicates between pages
  });

  it("handles a total that is an exact multiple of the page size", async () => {
    const t = fakeTable(2000);
    const rows = await fetchAllRows(t.fetchPage, 1000);
    expect(rows).toHaveLength(2000);
    expect(t.calls).toHaveLength(3); // last page is empty, which ends the loop
  });

  it("throws instead of returning partial data when a page fails", async () => {
    let n = 0;
    const failing = async () =>
      ++n === 1
        ? { data: Array.from({ length: 1000 }, (_, i) => i), error: null }
        : { data: null, error: new Error("boom") };
    await expect(fetchAllRows(failing, 1000)).rejects.toThrow("boom");
  });
});
