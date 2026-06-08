export type DoorAction = "open" | "close";

export type TasmotaConfig = {
  ip: string;
  port: string;
  user: string;
  password: string;
};

const CMD_NUM: Record<DoorAction, number> = {
  open: 3,
  close: 2,
};

const PRE_CLEAR_CHANNELS = [1, 4] as const;
const BURST_GAP_MS = 200;
const USER_AGENT_TIMEOUT_MS = 5000;

function buildUrl(cfg: TasmotaConfig, cmnd: string): string {
  return `http://${cfg.ip}:${cfg.port}/cm?user=${cfg.user}&password=${cfg.password}&cmnd=${cmnd}`;
}

export async function runDoorAction(
  action: DoorAction,
  cfg: TasmotaConfig,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const cmd = CMD_NUM[action];

  const offUrls = [
    buildUrl(cfg, `Power${cmd}%20Off`),
    ...PRE_CLEAR_CHANNELS.map((c) => buildUrl(cfg, `Power${c}%20Off`)),
  ];
  await Promise.all(
    offUrls.map((url) =>
      fetcher(url, { method: "GET" }).catch((err) => {
        throw new Error(`Tasmota pre-clear failed: ${(err as Error).message}`);
      }),
    ),
  );

  await new Promise((resolve) => setTimeout(resolve, BURST_GAP_MS));

  const onUrl = buildUrl(cfg, `Power${cmd}%20On`);
  const response = await fetcher(onUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Tasmota error: ${response.status}`);
  }
}

export { CMD_NUM, BURST_GAP_MS, USER_AGENT_TIMEOUT_MS };
