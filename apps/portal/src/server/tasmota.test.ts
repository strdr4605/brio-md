import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runDoorAction } from "./tasmota";

const cfg = {
  ip: "92.181.2.40",
  port: "1883",
  user: "admin",
  password: "philipsvibe",
};

describe("runDoorAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires Power{cmd}Off, Power1 Off, Power4 Off in parallel, then Power{cmd}On after 200ms (open)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const promise = runDoorAction("open", cfg, fetchMock as unknown as typeof fetch);
    await vi.runAllTimersAsync();
    await promise;

    const calls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(calls).toEqual([
      "http://92.181.2.40:1883/cm?user=admin&password=philipsvibe&cmnd=Power3%20Off",
      "http://92.181.2.40:1883/cm?user=admin&password=philipsvibe&cmnd=Power1%20Off",
      "http://92.181.2.40:1883/cm?user=admin&password=philipsvibe&cmnd=Power4%20Off",
      "http://92.181.2.40:1883/cm?user=admin&password=philipsvibe&cmnd=Power3%20On",
    ]);
  });

  it("uses Power2 for close action", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const promise = runDoorAction("close", cfg, fetchMock as unknown as typeof fetch);
    await vi.runAllTimersAsync();
    await promise;

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some((u) => u.endsWith("Power2%20Off"))).toBe(true);
    expect(urls.some((u) => u.endsWith("Power2%20On"))).toBe(true);
    expect(urls.some((u) => u.endsWith("Power3%20On"))).toBe(false);
  });

  it("waits 200ms between Off burst and On pulse", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const promise = runDoorAction("open", cfg, fetchMock as unknown as typeof fetch);
    await vi.advanceTimersByTimeAsync(199);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("throws when Tasmota returns non-ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const promise = runDoorAction("open", cfg, fetchMock as unknown as typeof fetch);
    promise.catch(() => {});
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow(/Tasmota/);
  });
});
