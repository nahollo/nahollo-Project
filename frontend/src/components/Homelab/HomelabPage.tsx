import React, { useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import {
  AppStatusResponse,
  DeploymentLogEntry,
  fetchAppStatus,
  fetchDeployments,
  fetchSystemStatus,
  fetchUptime,
  fetchVisitorStats,
  SystemStatusResponse,
  VisitorStatsResponse
} from "../../lib/api";

function Gauge({
  label,
  value,
  suffix = "%"
}: {
  readonly label: string;
  readonly value: number | null;
  readonly suffix?: string;
}): JSX.Element {
  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <article className="homelab-gauge">
      <div className="homelab-gauge-head">
        <span>{label}</span>
        <strong>{value === null ? "N/A" : `${safeValue.toFixed(0)}${suffix}`}</strong>
      </div>
      <div className="stat-gauge">
        <span className="stat-gauge-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </article>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${remainder
    .toString()
    .padStart(2, "0")}s`;
}

function formatDeployTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function HomelabPage(): JSX.Element {
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatusResponse | null>(null);
  const [deployments, setDeployments] = useState<readonly DeploymentLogEntry[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStatsResponse | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadEverything = async () => {
      try {
        const [system, app, deploy, visitors, uptime] = await Promise.all([
          fetchSystemStatus(),
          fetchAppStatus(),
          fetchDeployments(),
          fetchVisitorStats(),
          fetchUptime()
        ]);

        if (!isMounted) {
          return;
        }

        setSystemStatus(system);
        setAppStatus(app);
        setDeployments(deploy);
        setVisitorStats(visitors);
        setUptimeSeconds(uptime.seconds);
      } catch (error) {
        if (!isMounted) {
          return;
        }
      }
    };

    void loadEverything();

    const polling = window.setInterval(() => {
      void loadEverything();
    }, 20000);

    const uptimeTicker = window.setInterval(() => {
      setUptimeSeconds((previous) => previous + 1);
    }, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(polling);
      window.clearInterval(uptimeTicker);
    };
  }, []);

  const databaseIndicator = useMemo(() => {
    if (!appStatus) {
      return { label: "checking", active: false };
    }

    return appStatus.database.connected
      ? { label: "connected", active: true }
      : { label: "disconnected", active: false };
  }, [appStatus]);

  return (
    <section className="playground-page page-homelab homelab-page">
      <Container className="playground-shell homelab-shell">
        <header className="page-intro homelab-intro">
          <div className="page-intro-head">
            <span className="section-eyebrow">Homelab</span>
            <h1 className="page-title glow-text">personal server terminal</h1>
            <p className="page-intro-description">
              이 페이지는 라이트 모드에서도 항상 어둡게 유지됩니다. 현재 서버 상태, 업타임, DB 연결, 배포 로그, 방문자 통계를 한곳에 모았습니다.
            </p>
          </div>
        </header>

        <div className="homelab-terminal">
          <div className="homelab-terminal-head">
            <span>nahollo@homeserver:~</span>
            <span>{appStatus?.environment ?? "loading"}</span>
          </div>

          <div className="homelab-grid">
            <section className="homelab-panel">
              <div className="homelab-panel-head">
                <span className="section-eyebrow">System</span>
                <strong>live gauges</strong>
              </div>

              <Gauge label="CPU usage" value={systemStatus?.cpu ?? null} />
              <Gauge label="RAM usage" value={systemStatus?.ram ?? null} />
              <Gauge label="Disk usage" value={systemStatus?.disk ?? null} />
              <Gauge label="CPU temperature" value={systemStatus?.temperature ?? null} suffix="°C" />
            </section>

            <section className="homelab-panel">
              <div className="homelab-panel-head">
                <span className="section-eyebrow">Runtime</span>
                <strong>service status</strong>
              </div>

              <div className="terminal-block">
                <ul className="homelab-stat-list">
                  <li>
                    <span>Uptime</span>
                    <strong>{formatUptime(uptimeSeconds)}</strong>
                  </li>
                  <li>
                    <span>DB connection</span>
                    <strong className={databaseIndicator.active ? "is-green" : "is-red"}>{databaseIndicator.label}</strong>
                  </li>
                  <li>
                    <span>Today visitors</span>
                    <strong>{visitorStats ? visitorStats.today.toLocaleString() : "..."}</strong>
                  </li>
                  <li>
                    <span>Total visitors</span>
                    <strong>{visitorStats ? visitorStats.total.toLocaleString() : "..."}</strong>
                  </li>
                </ul>
              </div>
            </section>

            <section className="homelab-panel homelab-panel-wide">
              <div className="homelab-panel-head">
                <span className="section-eyebrow">Deploys</span>
                <strong>latest GitHub Actions runs</strong>
              </div>

              {deployments.length > 0 ? (
                <div className="terminal-block">
                  <ul className="deploy-log-list">
                    {deployments.slice(0, 5).map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.workflowName}</strong>
                          <span>
                            {item.repository} · {item.branch}
                          </span>
                        </div>
                        <div className="deploy-log-meta">
                          <em className={item.conclusion === "success" ? "is-green" : "is-red"}>{item.conclusion}</em>
                          <span>{formatDeployTime(item.finishedAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="game-helper-text">아직 들어온 배포 웹훅이 없습니다.</p>
              )}
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default HomelabPage;
